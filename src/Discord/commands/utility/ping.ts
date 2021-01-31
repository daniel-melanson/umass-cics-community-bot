import { Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";

export default {
	identifier: "ping",
	group: "Utility",
	description: "Responds to the invoking message with information about latency.",
	examples: ["!ping"],
	func: async (message: Message) => {
		const pingMsg = await message.reply("Pinging...");
		return pingMsg.edit(
			oneLine(`
			🏓 Pong! The message round-trip took ${
				(pingMsg.editedTimestamp || pingMsg.createdTimestamp) -
				(message.editedTimestamp || message.createdTimestamp)
			}ms.
			${message.client.ws.ping ? `The websocket heartbeat is ${Math.round(message.client.ws.ping)}ms.` : ""}
		`),
		);
	},
} as Command;
