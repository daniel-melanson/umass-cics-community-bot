/**
 * @author Daniel Melanson
 * @date 5/13/2020
 * @desc Entry point for discord bot
 */

import DiscordBot from "./discord-bot";
import config from "./config.json";

const bot = new DiscordBot(config);

process.on('SIGINT', async () => {
    await bot.destroy();

    process.exit(0);
});