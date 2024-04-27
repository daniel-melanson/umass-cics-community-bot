import fs from "node:fs";
import path from "node:path";

import { Collection, Events } from "discord.js";

import type DiscordCommand from "@/interfaces/discord-command";
import cron from "node-cron";
import { logger } from "@/utils/logger";
import { panic } from "./utils/panic";
import { client } from "./classes/discord-client";
import { CICSEventsAnnouncement } from "./tasks/cics-events-announcement";
import { TermProgressAnnouncement } from "./tasks/term-progress-announcement";

client.once(Events.ClientReady, async (c) => {
  logger.info(`Logged in as ${c.user.tag}`);

  logger.trace("Loading commands...");
  const commandDirectory = path.resolve(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandDirectory, { recursive: true, encoding: "utf-8" })
    .filter((file) => file.endsWith(".command.ts"));

  const commands = new Collection<string, DiscordCommand>();
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
      }),
    );
  } catch (e) {
    panic("Unable to load commands", e);
  }

  await client.registerCommands(commands);

  cron.schedule("0 0 7 * * *", CICSEventsAnnouncement);
  cron.schedule("0 0 7 * * 1", TermProgressAnnouncement);
});
