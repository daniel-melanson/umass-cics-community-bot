import fetch from "node-fetch";

import { register } from "Discord/registry";
import { codeWrap } from "Discord/formatting";

register({
	identifier: "tex",
	formalName: "TeX",
	aliases: ["latex"],
	patterns: [/$\$(.+)\$^/m],
	description: "Renders a TeX expression as a JPG and posts it in the invoking channel.",
	details:
		"This command can be invoked either by !tex, !latex, or even wrapping an expression in dollar signs like this `$x + 2$`.",
	examples: ["!tex y = \\sum_{x=0}^{10} x^2", "$\\frac{\\pi}{2} = \\int_{-1}^{1} \\sqrt{1-x^2} dx$"],
	clientPermissions: ["SEND_MESSAGES"],
	arguments: [
		{
			name: "expression",
			type: "string",
			infinite: true,
		},
	],
	func: async (client, message, result) => {
		const reply = await message.reply(`processing...`);

		let image,
			error = "Unknown";
		try {
			const res = await fetch(`https://latex2image.joeraut.com/convert`, {
				method: "POST",
				body: new URLSearchParams([
					["latexInput", result.matched ? result.matched[1] : (result.args["expression"] as string)],
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
			await reply.delete();
			message.channel.send({
				files: [
					{
						attachment: image,
						name: "tex.jpg",
					},
				],
			});
		} else {
			reply.edit(`Unable to convert TeX to JPG. Error: ${codeWrap(error)}`);
		}
	},
});
