import { CommandoClient } from "discord.js-commando"

export default class DiscordBot extends CommandoClient {
	constructor(config: object) {
		super();
	}

	async destroy(): Promise<void> {
		await super.destroy();
	}
}
