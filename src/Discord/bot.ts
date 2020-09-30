import { TextChannel } from "discord.js";
import { CommandoClient } from "discord.js-commando";
import { config } from "dotenv";

config();

export class Client extends CommandoClient {
	private readonly guildChannels = new Map<string, TextChannel>();

	constructor() {
		super({
			owner: process.env["DISCORD_OWNER_ID"],
			commandPrefix: "!",
		});

		this.registry
			.registerGroups([
				["admin", "Administrative"],
				["roles", "Roles"],
				["courses", "Courses"],
				["misc", "Miscellaneous"],
			])
			.registerDefaults();

		this.on("ready", this.ready.bind(this));

		void this.login(process.env["DISCORD_TOKEN"]);
	}

	destroy(msg?: string): void {
		if (!msg) msg = "Logging out...";

		super.destroy();
	}

	private async ready(): Promise<void> {
		console.log(`Logged in as ${this.user?.tag}`);

		const id = process.env["DISCORD_GUILD_ID"];
		if (!id) return this.destroy("Unable to find process environment variable DISCORD_GUILD_ID");

		const guild = this.guilds.resolve(id);
		if (!guild) return this.destroy(`Unable to find guild ${id}`);

		const textChannels = guild.channels.cache.filter((c) => c instanceof TextChannel);

		["general", "community-events", "bot-log"].forEach((name) => {
			const channel = textChannels.find((c) => c.name === name);
			if (channel) this.guildChannels.set(name, channel as TextChannel);
			else console.warn(`Unable to find text channel: ${name}`);
		});
	}
}
