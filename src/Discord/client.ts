import { Client } from "discord.js";
import { config } from "dotenv";

config();

export class CICSClient extends Client {
	private ownerId: string;

	constructor() {
		super();

		const id = process.env["DISCORD_OWNER_ID"];
		if (!id) {
			console.error("Could not find `DISCORD_OWNER_ID` environment variable.");
			process.exit(-1);
		}
		this.ownerId = id;

		void this.login(process.env["DISCORD_TOKEN"]);
	}
}
