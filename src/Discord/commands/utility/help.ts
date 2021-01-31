import { Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";

export default {
	identifier: "help",
	aliases: ["h"],
	group: "Utility",
	description: "Provides general information about the bot and available commands.",
	examples: ["!help", "!help what-is"],
	arguments: [
		{
			name: "command",
			type: "string",
			optional: true,
		},
	],
	func: async (message: Message, result: { command?: string; commandList: Array<Command> }) => {
		const commandQuery = result.command;

		let replyString;
		if (commandQuery) {
			const command = result.commandList.find(command => command.identifier.toLowerCase() === commandQuery);
			if (!command) return;

			replyString = `The **${command.formalName || command.identifier}** command: ${command.description}\n`;

			if (command.details) {
				replyString += "\n" + command.details;
			}

			if (command.aliases) {
				replyString += "\n" + `__Aliases__: ${command.aliases.join(", ")}`;
			}

			if (command.examples && command.examples.length > 0) {
				replyString += "\n" + `__Examples__: ${command.examples.map(ex => `\`${ex}\``).join(", ")}`;
			}
		} else {
			replyString =
				oneLine(`
				Welcome to the UMass CICS Community discord server!
				Below is a list of all commands the bot listens for.
				Keep in mind that you may not be allowed to execute some commands.
			`) + "\n";

			for (const group of ["Administrative", "Information", "Miscellaneous", "Roles", "Utility"]) {
				const commandsInGroup = result.commandList.filter(cmd => cmd.group === group);

				replyString += `\n__${group}__\n`;

				for (const command of commandsInGroup) {
					replyString += `**${command.identifier}**: ${command.description}\n`;
				}
			}
		}

		return message.reply(replyString, {
			split: true,
		});
	},
} as Command;
