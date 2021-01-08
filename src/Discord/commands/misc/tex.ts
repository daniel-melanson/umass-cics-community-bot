import fetch from "node-fetch";

import { Client, Message } from "discord.js";

import { Command, ArgumentResult } from "Discord/commands/types";

export default {
	identifier: "TeX",
	group: "Miscellaneous",
	aliases: ["latex"],
	patterns: [/\$(.)+\$/],
	description: "Renders a given TeX expression and posts the output.",
	details: "This command will only render valid **TeX** expressions. ",
	examples: [],
	arguments: [
		{
			name: "expression",
			type: "string",
			infinite: true,
		},
	],
	func: async (client: Client, message: Message, result: ArgumentResult) => {
		const reply = (await message.reply(`processing...`)) as Message;

		let image,
			error = "Unknown";
		try {
			const res = await fetch(`https://latex2image.joeraut.com/convert`, {
				method: "POST",
				body: new URLSearchParams([
					[
						"latexInput",
						result.groups ? result.groups[1] : (result.args as Record<string, string>)["expression"],
					],
					["outputScale", "500%"],
					["outputFormat", "JPG"],
				]),
			});

			const json = await res.json();
			if (json.imageURL) image = `https://latex2image.joeraut.com/${json.imageURL}`;
			else if (json.error) error = json.error;
		} catch (e) {
			if (e instanceof Error) {
				error = e.message;
			}
		}

		if (image) {
			reply.delete();
			return message.channel.send({
				files: [
					{
						attachment: image,
						name: "tex.jpg",
					},
				],
			});
		} else {
			return reply.edit(`Unable to convert TeX to JPG.`, {
				code: error,
			});
		}
	},
} as Command;
