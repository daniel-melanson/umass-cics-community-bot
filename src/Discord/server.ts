import { TextChannel } from "discord.js";
import { CommandoClient } from "discord.js-commando";
import { config } from "dotenv";

config();

export class Community {
	private readonly client = new CommandoClient({
		owner: process.env["DISCORD_OWNER_ID"],
		commandPrefix: "!",
	});
	private readonly textChannels = new Map<string, TextChannel>();

	constructor() {
		const client = this.client;
		client.registry
			.registerGroups([
				["admin", "Administrative"],
				["roles", "Roles"],
				["courses", "Courses"],
				["misc", "Miscellaneous"],
			])
			.registerDefaults();

		client.on("ready", this.ready.bind(this));

		void client.login(process.env["DISCORD_TOKEN"]);
	}

	destroy(msg?: string): void {
		if (!msg) msg = "Logging out...";

		this.client.destroy();
	}

	private async ready(): Promise<void> {
		console.log(`Logged in as ${this.client.user?.tag}`);

		const id = process.env["DISCORD_GUILD_ID"];
		if (!id) return this.destroy("Unable to find process environment variable DISCORD_GUILD_ID");

		const guild = this.client.guilds.resolve(id);
		if (!guild) return this.destroy(`Unable to find guild ${id}`);

		const textChannels = guild.channels.cache.filter((c) => c instanceof TextChannel);

		["general", "community-events", "bot-log"].forEach((name) => {
			const channel = textChannels.find((c) => c.name === name);
			if (channel) this.textChannels.set(name, channel as TextChannel);
			else console.warn(`Unable to find text channel: ${name}`);
		});
	}
}
