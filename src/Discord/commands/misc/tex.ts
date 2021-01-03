/*
import fetch from "node-fetch";

	const reply = (await message.reply(`processing...`)) as Message;

	let image,
		error = "Unknown";
	try {
		const res = await fetch(`https://latex2image.joeraut.com/convert`, {
			method: "POST",
			body: new URLSearchParams([
				[
					"latexInput",
					fromPattern ? (args as Array<string>)[1] : (args as Record<string, string>)["expression"],
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
*/
