import { Client, Message } from "discord.js";
import { oneLine } from "common-tags";

import { Command } from "Discord/commands/types";
import { formatEmbed } from "Discord/formatting";

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
				description: oneLine(`The source code of the bot is written in TypeScript.
					Once build, the code is run using [Node.js](https://nodejs.org/en/).
					To interact with the Discord API, the bot uses the [Discord.js](https://discord.js.org/#/) npm package.
					The bot process is hosted on a private virtual machine.
					Various features of the bot, such as course related commands, makes requests to a private MongoDB instance.
					This instance is updated weekly using the following [project](https://github.com/daniel-melanson/umass-spire-scraper).`),
				fields: [
					{
						name: "Contribute",
						value: `Check out the source code on [GitHub](https://github.com/daniel-melanson/UMass-CICS-Discord-Bot)! <:github:710221621469642808>`,
					},
					{
						name: "Report Bugs",
						value: `If you find a bug, you can report it to an admin, or make a ticket [here](https://github.com/daniel-melanson/UMass-CICS-Discord-Bot/issues).`,
					},
				],
				timestamp: false,
			}),
		);
	},
} as Command;
