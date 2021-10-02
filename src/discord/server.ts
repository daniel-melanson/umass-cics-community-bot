import {
  ApplicationCommand,
  ApplicationCommandPermissions,
  BaseGuildTextChannel,
  Client,
  CommandInteraction,
  Guild,
  GuildMember,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
  MessageOptions,
} from "discord.js";

import { error, log, warn } from "#shared/logger";
import { oneLine } from "#shared/stringUtil";

import { importCommands } from "./commands/index";
import { createRoleEmbed } from "./commands/roles/roles";

import { isAssignable } from "./roles";

import { Command, CommandPermissionLevel } from "./classes/SlashCommandBuilder";
import { MessageEmbedBuilder } from "./classes/MessageEmbedBuilder";
import { CommandError } from "./classes/CommandError";
import { PatternInteraction } from "./classes/PatternInteraction";
import { toMessageOptions } from "./toMessageOptions";

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS],
});

const DISCORD_TOKEN = process.env["DISCORD_TOKEN"]!;
const DISCORD_GUILD_ID = process.env["DISCORD_GUILD_ID"]!;
const DISCORD_OWNER_ID = process.env["DISCORD_OWNER_ID"]!;

if (!DISCORD_TOKEN) {
  error("MAIN", "Environment variable 'DISCORD_TOKEN' was not defined.");
}

if (!DISCORD_GUILD_ID) {
  error("MAIN", "Environment variable 'DISCORD_GUILD_ID' was not defined.");
}

if (!DISCORD_OWNER_ID) {
  error("MAIN", "Environment variable 'DISCORD_OWNER_ID' was not defined.");
}

const CONTACT_MESSAGE = ` Please contact <@${DISCORD_OWNER_ID}>.`;
const guildCommands = new Map<string, Command>();

async function attemptInteraction(interaction: CommandInteraction | PatternInteraction, command: Command) {
  const reply = (msg: MessageOptions, ephemeral?: boolean) => {
    if (interaction instanceof CommandInteraction) {
      const payload = Object.assign(
        {
          ephemeral: ephemeral,
        },
        msg,
      );

      (interaction.replied ? interaction.followUp(payload) : interaction.reply(payload)).catch(e =>
        warn("DISCORD", "Unable to send user reply:", e),
      );
    } else {
      interaction.reply(msg);
    }
  };

  let replyContent;
  try {
    replyContent = await command.fn(interaction);
  } catch (e) {
    const header = "COMMAND-" + command.name;
    if (e instanceof CommandError) {
      reply(toMessageOptions(e.userMessage), true);
      if (e.internalMessage) warn(header, e.internalMessage, e.stack);
    } else {
      warn(header, "!!Uncaught command error!!", e);
      reply(toMessageOptions("An unexpected error occurred." + CONTACT_MESSAGE), true);
    }
  }

  if (replyContent) reply(toMessageOptions(replyContent));
}

async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const command = guildCommands.get(interaction.commandId);
  if (!command) {
    interaction.reply("Unexpected error occurred. No command found." + CONTACT_MESSAGE);
  } else {
    attemptInteraction(interaction, command);
  }
}

async function messageCreate(message: Message) {
  if (!message.guild || message.author.bot) return;

  if (message.content === "^" && message.deletable) {
    const previousMessage = (
      await message.channel.messages.fetch({
        limit: 1,
        before: message.id,
      })
    ).first();

    if (previousMessage) {
      if (previousMessage.author.id === message.author.id) {
        message.reply(`${message.member?.displayName} just tried to upvote their own message. Shame on them.`);
      } else {
        const upvote = message.guild.emojis.cache.find(e => e.name === "upvote");

        if (upvote) {
          try {
            await previousMessage.react(upvote);
            setTimeout(() => message.delete(), 2000);
          } catch (e) {
            warn("DISCORD", "Failed to upvote message.", e);
          }
        } else {
          console.error("[SERVER] Unable to find upvote emoji.");
        }
      }
    }
  } else if (message.content.match(/\(?u(pvote)?\/d(ownvote)?\)?$/i)) {
    const emojis = message.guild.emojis.cache;

    const find = (name: string) => emojis.find(e => e.name === name);
    let upvote, downvote;
    if (!(upvote = find("upvote")) || !(downvote = find("downvote"))) {
      warn("DISCORD", "Unable to find upvote and downvote emojis.");
      return;
    }

    try {
      await message.react(upvote);
      await message.react(downvote);
    } catch (e) {
      message.reply("I'm sorry, I was unable to react with emotes.");
    }
  } else if (message.content.match(/^!\w+/)) {
    message.reply(
      oneLine(`Discord has updated the way that users can interact with bots.
      This opens the door for a lot more features and makes interacting with the bot a lot smoother.
      To avoid breaking unexpectedly, and to use these new features, I have updated to slash commands.
      This replaces the previous message command system (\`!help\`). However, some commands can still be invoked
      using patterns like \`What is CS 121?\` or \`$$\\frac{x}{2}$$\`.
      **Type \`/help\` to get started.**
      I am sorry for the inconvenience.`),
    );
  } else {
    for (const command of guildCommands.values()) {
      if (!command.pattern) continue;

      const match = message.content.match(command.pattern.regExp);
      if (match) {
        attemptInteraction(new PatternInteraction(message, match, command.pattern.groups), command);
        break;
      }
    }
  }
}

function findChannel(guild: Guild, name: string) {
  const nameRegExp = new RegExp(`^\\W{0,2}${name}\\W{0,2}$`);
  return guild.channels.cache.find(
    x => (x.type === "GUILD_NEWS" || x.type === "GUILD_TEXT") && !!x.name.match(nameRegExp),
  ) as BaseGuildTextChannel;
}

async function guildMemberAdd(member: GuildMember) {
  if (member.guild.id !== DISCORD_GUILD_ID) return;

  const id = member.id;

  await member.setNickname("~ real name please");
  await announce(
    "bot-log",
    new MessageEmbedBuilder({
      description: oneLine(`<@${member.user.id}> has joined.
						Their account was created on ${member.user.createdAt.toLocaleDateString()}`),
    }).setUser(member.user),
  );

  setTimeout(async () => {
    let updated;
    try {
      updated = await member.guild.members.fetch({ user: id, force: true });
    } catch (e) {
      return;
    }

    if (updated.nickname !== "real name please" && updated.roles.cache.size > 1) return;

    const get = (name: string) => {
      const channel = findChannel(member.guild, `how-to-${name}`);
      if (!channel) return "";

      return `<#${channel.id}>`;
    };

    await announce("bot-commands", {
      content: `Hey there, <@${member.id}>! It seems like you don't have any roles. Make sure to update your nickname if you have not already.`,
      embeds: [
        new MessageEmbedBuilder({
          title: `Welcome to the Server!`,
          fields: [
            {
              name: "Getting Familiar With The Server",
              value: oneLine(`If you are unfamiliar with the server,
										make sure to read the how-to channels (${get("roles")}, ${get("notifications")})`),
            },
          ],
        }),
      ],
    });
    announce("bot-commands", createRoleEmbed(updated.guild));
  }, 1000 * 60);

  setTimeout(async () => {
    let updated;
    try {
      updated = await member.guild.members.fetch({ user: id, force: true });
    } catch (e) {
      return;
    }

    if (updated.nickname === "~ real name please") {
      announce(
        "bot-commands",
        oneLine(`<@${member.id}> you still have not updated your nickname.
						Here are some steps if you are lost: 
						(**Desktop**) Click on \`UMass CICS Community\`
						in bold in the top left of your screen.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`) +
          `\n\n` +
          oneLine(`(**Mobile**) Swipe to the right to display your sever list.
						Press the three vertically aligned dots next to \`UMass CICS Community\`.
						Press \`Change Nickname\`, enter your identifier, and \`Save\`.`),
      );
    }
  }, 1000 * 60 * 5);
}

export async function announce(
  name: "general" | "university" | "bot-log" | "bot-commands" | "cics-events",
  message: string | MessageEmbed | MessageOptions,
): Promise<Message> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
  const channel = findChannel(guild, name);

  if (channel) {
    return channel.send(message instanceof MessageEmbed ? { embeds: [message] } : message);
  } else {
    throw new Error("Unable to find channel " + name);
  }
}

export function initialize(): Promise<Client<true>> {
  return new Promise((res, rej) => {
    log("MAIN", "Logging in...");
    client
      .on("ready", async client => {
        log("MAIN", `Logged in as ${client.user.tag}.`);
        log("MAIN", "Initializing application commands...");

        try {
          log("MAIN", "Building commands...");
          const guild = await client.guilds.fetch(DISCORD_GUILD_ID);

          if (process.env["DISCORD_CLEAR_PERMISSIONS"]) {
            const guildRoleCollection = await guild.roles.fetch();
            for (const [, role] of guildRoleCollection) {
              if (isAssignable(role.name)) {
                await role.setPermissions(0n);
              }
            }
          }

          const commandData = importCommands();
          const applicationCommandCollection = await guild.commands.set(commandData.map(cmd => cmd.apiData));
          log("MAIN", `Built ${applicationCommandCollection.size} commands.`);

          log("MAIN", `Setting up permissions...`);
          const applicationCommandMap = new Map<string, ApplicationCommand>();
          for (const [, appCmd] of applicationCommandCollection) {
            applicationCommandMap.set(appCmd.name, appCmd);
          }

          const roles = await guild.roles.fetch();
          const createRolePermission = (name: string) => {
            const role = roles.find(r => r.name === name);
            if (!role) throw new Error("Unable to find role " + name);

            return {
              id: role.id,
              type: "ROLE",
              permission: true,
            } as ApplicationCommandPermissions;
          };

          const adminPermission = createRolePermission(CommandPermissionLevel.Administrator);
          const moderatorPermission = createRolePermission(CommandPermissionLevel.Moderator);

          for (const command of commandData) {
            const appCmd = applicationCommandMap.get(command.apiData.name)!;

            guildCommands.set(appCmd.id, command.runtimeData);

            const permissionLevel = command.permissionLevel;
            if (permissionLevel !== CommandPermissionLevel.Member) {
              const permissionArray: Array<ApplicationCommandPermissions> = [
                {
                  id: DISCORD_OWNER_ID,
                  type: "USER",
                  permission: true,
                },
                {
                  id: guild.roles.everyone.id,
                  type: "ROLE",
                  permission: false,
                },
              ];

              if (permissionLevel === CommandPermissionLevel.Moderator) {
                permissionArray.push(moderatorPermission);
              } else if (permissionLevel === CommandPermissionLevel.Administrator) {
                permissionArray.push(adminPermission);
              }

              await appCmd.permissions.add({
                permissions: permissionArray,
              });
            }
          }
          log("MAIN", `Permissions set up.`);

          client.on("interactionCreate", interactionCreate);
          client.on("messageCreate", messageCreate);
          client.on("guildMemberAdd", guildMemberAdd);

          log("MAIN", "Application commands initialized. Ready for interaction.");
          res(client);
        } catch (e) {
          rej(e);
        }
      })
      .login(DISCORD_TOKEN);
  });
}
