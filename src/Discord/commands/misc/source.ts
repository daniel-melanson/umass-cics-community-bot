import { Client, Message } from "discord.js";
import { oneLine } from "common-tags";

import { Command } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const { bugs, homepage } = require("../../../../package.json");

export default {
	identifier: "source",
	aliases: ["bugs", "info"],
	group: "Miscellaneous",
	description: "Responds with information about the bot.",
	examples: ["!source"],
	func: async (client: Client, message: Message) => {
		return message.reply(
			formatEmbed({
				title: "Discord Bot Information",
				description: oneLine(`The source of the bot is written in TypeScript.
					The bot process is hosted on a private virtual machine.
					Various features of the bot makes requests to a private MongoDB instance.
					This instance is updated weekly using the following [project](https://github.com/daniel-melanson/umass-spire-scraper).`),
				fields: [
					{
						name: "Contribute",
						value: `Check out the source code on [github](${homepage})! <:github:710221621469642808>`,
					},
					{
						name: "Report Bugs",
						value: `If you find a bug, you can report it to an admin, or make a ticket [here](${bugs.url}).`,
					},
				],
			}),
		);
	},
} as Command;
