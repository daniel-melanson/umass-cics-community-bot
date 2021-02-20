import fetch from "node-fetch";

import { Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";

export default {
	identifier: "TeX",
	group: "Miscellaneous",
	aliases: ["latex"],
	patterns: [/\$\$([^\$]+)\$\$/],
	description: "Renders a given TeX expression and posts the output.",
	details: oneLine(`
		This command will only render valid **TeX** expressions.
		Advanced LaTeX tags such as \`\\usepackage\` or \`\\align\` will not work.
	`),
	examples: ["!latex y = \\sum_{x=0}^{10} x^5", "$\\frac{n^2 + n}{n}$"],
	parameters: [
		{
			name: "expression",
			type: "string",
			prompt: "supply an expression for me to render.",
			matchGroupIndex: 1,
		},
	],
	func: async (message: Message, result: { expression: string }) => {
		const reply = await message.reply(`processing...`);

		let image,
			error = "Unknown";
		try {
			const res = await fetch(`http://www.latex2png.com/api/convert`, {
				method: "POST",
				body: JSON.stringify({
					auth: { user: "guest", password: "guest" },
					latex: result.expression,
					resolution: 600,
					color: "D53131",
				}),
			});
			const json = await res.json();
			if (json.url) image = `http://www.latex2png.com${json.url}`;
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
						name: "tex.png",
					},
				],
			});
		} else {
			return reply.edit(`Unable to convert TeX to png.`, {
				code: error,
			});
		}
	},
} as Command;
