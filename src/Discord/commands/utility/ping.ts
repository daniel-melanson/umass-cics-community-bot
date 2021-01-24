import { Client, Message } from "discord.js";

import { Command } from "Discord/commands/types";
import { oneLine } from "Shared/stringUtil";

export default {
	identifier: "ping",
	group: "Utility",
	description: "Responds to the invoking message with information about latency.",
	examples: ["!ping"],
	func: async (client: Client, message: Message) => {
		const pingMsg = await message.reply("Pinging...");
		return pingMsg.edit(
			oneLine(`
			🏓 Pong! The message round-trip took ${
				(pingMsg.editedTimestamp || pingMsg.createdTimestamp) -
				(message.editedTimestamp || message.createdTimestamp)
			}ms.
			${client.ws.ping ? `The websocket heartbeat is ${Math.round(client.ws.ping)}ms.` : ""}
		`),
		);
	},
} as Command;
