import path from "path";
import fs from "fs";

import { SlashCommandBuilder } from "../builders/SlashCommandBuilder";

const __filename = import.meta.url.replace("file:/", "/");
const __dirname = __filename.substring(0, __filename.lastIndexOf("/") + 1);

export async function importCommands(): Promise<Array<SlashCommandBuilder>> {
  const builders = new Map<string, SlashCommandBuilder>();

  for (const folder of ["admin", "info", "roles", "util"]) {
    const groupPath = path.join(__dirname, folder);

    for (const file of fs.readdirSync(groupPath)) {
      if (!file.match(/^[\w-]+\.js$/)) continue;

      const fullPath = path.join(groupPath, file);

      let commandModule;
      try {
        commandModule = await import(fullPath);
      } catch (e) {
        throw new Error(`Failed to import command: ${fullPath}\n\n${e}`);
      }

      if (!commandModule.default) {
        throw new Error(`Command ${fullPath} does not have a default export.`);
      }

      const builder = commandModule.default as SlashCommandBuilder;
      if (builders.has(builder.name)) {
        throw new Error(`Command ${fullPath} as a duplicate name: ${builder.name}`);
      }

      builders.set(builder.name, builder);
    }
  }

  const builderArray = Array.from(builders.values());
  const helpCommand = builders.get("help");
  if (helpCommand) {
    const otherCommands = builderArray.filter(cmd => cmd.name !== "help");

    helpCommand.addStringOption(option =>
      option
        .setName("command")
        .setDescription("The command to get detailed information about.")
        .addChoices(otherCommands.map(cmd => [cmd.name, cmd.name])),
    );
  } else {
    throw new Error("Help command not found.");
  }

  return builderArray;
}
