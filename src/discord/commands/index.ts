import path from "path";
import fs from "fs";

import { BuiltCommand, SlashCommandBuilder } from "../classes/SlashCommandBuilder";
import { oneLine } from "#shared/stringUtil";
import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";

export function importCommands(): ReadonlyArray<BuiltCommand> {
  const builtCommands = new Map<string, BuiltCommand>();
  for (const folder of ["admin", "info", "roles", "util"]) {
    const groupPath = path.join(__dirname, folder);

    for (const file of fs.readdirSync(groupPath)) {
      if (!file.match(/^[\w-]+\.js$/)) continue;

      const fullPath = path.join(groupPath, file);

      let commandModule;
      try {
        commandModule = require(fullPath);
      } catch (e) {
        throw new Error(`Failed to import command: ${fullPath}\n\n${e}`);
      }

      if (!commandModule.default) {
        throw new Error(`Command ${fullPath} does not have a default export.`);
      }

      const builder = commandModule.default as SlashCommandBuilder;
      if (builtCommands.has(builder.name)) {
        throw new Error(`Command ${fullPath} as a duplicate name: ${builder.name}`);
      }

      builtCommands.set(builder.name, builder.build());
    }
  }

  builtCommands.set(
    "help",
    new SlashCommandBuilder()
      .setName("help")
      .setDescription("Display a help message.")
      .setGroup("Utility")
      .setCallback(() => {
        return new MessageEmbedBuilder({
          title: "UMass CICS Community Help",
          // description: `Click a button to view a list of commands for that category.`,
          //"\n\n" +
          //`To view help  for a specific command do \`/help <command-name>\``,
          fields: [
            {
              name: "What are slash commands?",
              value: oneLine(`Discord has introduced slash commands to make interacting with bots more
                standardized and more fluid. They allow a direct interface for users to interact with a bot.
                This is a replacement for the old method of message commands (\`!help\`).`),
            },
            {
              name: "What commands can I use?",
              value: oneLine(`To see a list of commands available to you, type a forward slash
                "/" in the message bar. You will see a side panel with different icons. These are the different
                bots with commands on this server. You can press on each of these icons to filter and look at the
                commands that you can use.`),
            },
            {
              name: "How do I use commands?",
              value: oneLine(`Type a forward slash \`/\` then the name of the command. There will be some
              tips that appear above the message bar to help you fill out commands. Discord will
              guide you on filling out options as well.`),
            },
          ],
        });
      })
      .build(),
  );

  return Array.from(builtCommands.values());
}
