/**
 * @author Daniel Melanson
 * @date 4/3/2020
 * @desc Entry point for discord bot
 */

// Modules

const DiscordBot = require('./discord-bot.js');
const config = require('./config');

// Entry
let bot = new DiscordBot(config); // Set up new bot

// Terminate gracefully when we request to kill the bot
process.on('SIGTERM', async () => {
   await bot.destroy();
});
