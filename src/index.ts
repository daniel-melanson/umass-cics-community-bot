import fs from "node:fs";
import assert from "node:assert";
import path from "node:path";

import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  userMention,
} from "discord.js";
import { oneLine } from "common-tags";

import type DiscordCommand from "@/interfaces/discord-command";
import { logger } from "@/utils/logger";
import DiscordCommandError from "./classes/discord-command-error";

function panic(message: string, error?: unknown) {
  if (error) logger.fatal("%s: %o", message, error);
  else logger.fatal(message);

  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
});

const DISCORD_APP_TOKEN = process.env.DISCORD_APP_TOKEN!;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;
const DISCORD_OWNER_ID = process.env.DISCORD_OWNER_ID!;
assert(
  DISCORD_APP_TOKEN && DISCORD_APP_ID && DISCORD_GUILD_ID && DISCORD_OWNER_ID,
  "Missing required environment variables",
);

const commands = new Collection<string, DiscordCommand>();

client.once(Events.ClientReady, async (c) => {
  logger.info(`Logged in as ${c.user.tag}`);

  logger.trace("Loading commands...");
  const commandData: any[] = [];
  const commandDirectory = path.resolve(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandDirectory, { recursive: true, encoding: "utf-8" })
    .filter((file) => file.endsWith(".command.ts"));

  try {
    await Promise.all(
      commandFiles.map(async (file) => {
        const filePath = path.join(commandDirectory, file);
        if (
          !filePath.match(/commands\/(?<group>[\w\-]+)\/[\w\-]+\.command\.ts$/)
        )
          panic(`Invalid command file: ${filePath}`);

        const moduleImport = await import(filePath);

        if (
          !moduleImport.default ||
          !moduleImport.default.data ||
          !moduleImport.default.run
        ) {
          panic(`Invalid command file: ${filePath}`);
        }

        const command = moduleImport.default as DiscordCommand;
        commands.set(command.data.name, command);
        commandData.push(command.data.toJSON());
      }),
    );
  } catch (e) {
    panic("Unable to load commands", e);
  }

  logger.trace("Registering commands...");
  const rest = new REST().setToken(DISCORD_APP_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(DISCORD_APP_ID, DISCORD_GUILD_ID),
      { body: commandData },
    );

    logger.info(`Successfully registered ${commands.size} commands`);
  } catch (e) {
    panic("Unable to register commands", e);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (command) {
    try {
      await command.run(interaction);
    } catch (error) {
      logger.error("Error executing command %s: %o", command.data.name, error);
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
    logger.warn("Unknown command %s: %o", interaction.commandName, interaction);

    await interaction.reply({
      content: "I don't know that command.",
      ephemeral: true,
    });
  }
});

client.login(DISCORD_APP_TOKEN);
