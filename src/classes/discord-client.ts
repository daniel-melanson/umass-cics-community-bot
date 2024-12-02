import {
  ChannelType,
  Client,
  Collection,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  GuildMember,
  MessagePayload,
  REST,
  Routes,
  TextChannel,
  channelMention,
  userMention,
  type Interaction,
  type MessageCreateOptions,
} from "discord.js";
import assert from "assert";
import { logger } from "@/utils/logger";
import DiscordCommandError from "./discord-command-error";
import { oneLine } from "common-tags";
import { panic } from "@/utils/panic";
import type DiscordCommand from "@/interfaces/discord-command";
import { DiscordEmbedBuilder } from "./discord-embed-builder";
import { minutes } from "@/utils/time";
import { createRoleEmbed } from "@/commands/roles/roles.command";

const DISCORD_APP_TOKEN = process.env.DISCORD_APP_TOKEN!;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_OWNER_ID = process.env.DISCORD_OWNER_ID!;
assert(
  DISCORD_APP_TOKEN && DISCORD_APP_ID && DISCORD_GUILD_ID && DISCORD_OWNER_ID,
  "Missing required environment variables",
);

type SendOptions = string | MessagePayload | MessageCreateOptions;

class DiscordClient extends Client {
  private commands = new Collection<string, DiscordCommand>();
  GUILD_ID = DISCORD_GUILD_ID;
  OWNER_ID = DISCORD_OWNER_ID;

  constructor() {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    });

    this.on(Events.InteractionCreate, this.onInteractionCreate.bind(this));
    this.on(Events.GuildMemberAdd, this.onGuildMemberAdd.bind(this));
  }

  private async fetchGuild() {
    return await this.guilds.fetch(DISCORD_GUILD_ID);
  }

  async fetchChannel(channelName: string) {
    const guild = await this.fetchGuild();
    const channels = await guild.channels.fetch();
    const nameMatches = (name: string, target: string) =>
      name === target ||
      new RegExp(`^${target}(-\\p{Emoji})?$`, "iu").test(name);

    return channels.find(
      (c) =>
        c &&
        c.type === ChannelType.GuildText &&
        nameMatches(c.name, channelName),
    );
  }

  async announce(channelName: string, message: SendOptions) {
    const channel = (await this.fetchChannel(channelName)) as TextChannel;
    assert(channel, `Channel ${channelName} not found`);

    return channel.send(message);
  }

  async error(message: SendOptions) {
    await this.announce("bot-log", `${userMention(DISCORD_OWNER_ID)}`);
    return this.announce("bot-log", message);
  }

  async log(message: SendOptions) {
    return this.announce("bot-log", message);
  }

  async registerCommands(commands: Collection<string, DiscordCommand>) {
    this.commands = this.commands.merge(
      commands,
      (x) => ({ keep: true, value: x }),
      (y) => ({ keep: true, value: y }),
      () => panic("Duplicate command name"),
    );

    logger.trace("Registering commands...");
    const rest = new REST().setToken(DISCORD_APP_TOKEN);

    try {
      await rest.put(
        Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID),
        { body: commands.map((command) => command.data.toJSON()) },
      );

      logger.info(`Successfully registered ${commands.size} commands`);
    } catch (e) {
      panic("Unable to register commands", e);
    }
  }

  async fetchGuildMember(userId: string, force = false) {
    const guild = await this.fetchGuild();

    return guild.members.fetch({ user: userId, force });
  }

  async onGuildMemberAdd(member: GuildMember) {
    if (member.user.bot || member.guild.id !== this.GUILD_ID) return;

    const DEFAULT_NAME = "~ real name please";

    const userId = member.id;
    await member.setNickname(DEFAULT_NAME);

    const embed = new DiscordEmbedBuilder()
      .setDescription(
        oneLine(`<@${member.user.id}> has joined.
              Their account was created on ${member.user.createdAt.toLocaleDateString()}`),
      )
      .setUser(member.user);

    await this.log({ embeds: [embed] });

    setTimeout(async () => {
      const updatedMember = await this.fetchGuildMember(userId, true);

      if (
        updatedMember.nickname !== DEFAULT_NAME &&
        updatedMember.roles.cache.size > 1
      )
        return;

      const mentionChannel = async (name: string) => {
        const channel = await this.fetchChannel(name);
        assert(channel, `${name} channel not found`);

        return channelMention(channel.id);
      };

      await this.announce("bot-commands", {
        content: `Hey there, ${userMention(member.id)}! It seems like you don't have any roles. Make sure to update your nickname if you have not already.`,
        embeds: [
          new DiscordEmbedBuilder()
            .setTitle("Welcome to the Server!")
            .addFields([
              {
                name: "Getting Familiar With The Server",
                value: oneLine(`
                If you are new to the server, make sure to read these channels: 
                    ${await mentionChannel("rules")}, ${await mentionChannel("how-to-roles")}, ${await mentionChannel("how-to-notifications")}`),
              },
            ]),
          createRoleEmbed(updatedMember.guild),
        ],
      });
    }, minutes(1));
  }
  async onInteractionCreate(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;
    logger.trace("interaction created");

    const command = this.commands.get(interaction.commandName);
    if (command) {
      logger.trace(`matched command ${command.data.name}`)

      try {
        await command.run(interaction);
      } catch (error) {
        logger.trace("command failed");
        const isDiscordCommandError = error instanceof DiscordCommandError;
        if (!isDiscordCommandError || error.error) {
          logger.error(isDiscordCommandError ? error.error : error);
        }

        const content =
          error instanceof DiscordCommandError
            ? error.userMessage
            : oneLine(`
          I had trouble executing that command. Please try again.
          If this problem persists, mention ${userMention(DISCORD_OWNER_ID)}`);

        await interaction.reply({
          content,
          ephemeral: true,
        });
      }
    } else {
      logger.warn(
        "Unknown command %s: %o",
        interaction.commandName,
        interaction,
      );

      await interaction.reply({
        content: "I don't know that command.",
        ephemeral: true,
      });
    }
  }
}

export const client = new DiscordClient();

client.login(DISCORD_APP_TOKEN);
