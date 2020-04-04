/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Extension of discord bot class
 * @type {module:"discord.js-commando"}
 */

const Commando = require('discord.js-commando');
const path = require('path');

class DiscordBot extends Commando.Client {
    /**
     * Creates a new DiscordBot
     * @param config An object with fields:
     *  config.owner The user ID of the bot's owner.
     *  config.commandPrefix The prefix to all commands, optional.
     *  config.token The bot token used to communicate with the discord api
     *  config.server-name The name of the server that the bot is serving
     */
    constructor(config) {
        super({
            owner: config.owner,
            commandPrefix: config.commandPrefix || '!',
            nonCommandEditable: false,

            disabledEvents: ['TYPING_START', 'VOICE_STATE_UPDATE', 'PRESENCE_UPDATE', 'MESSAGE_DELETE', 'MESSAGE_UPDATE'] // Disable unused events to reduce network traffic
        });

        // Register new groups to categorize the commands with
        this.registry.registerGroups([
            ['admin', 'Administrative'],
            ['roles', 'Roles'],
            ['classes', 'classes'],
            ['misc', 'Miscellaneous']
        ])
            .registerDefaults() // Register default types and commands
            .registerCommandsIn(path.join(__dirname, 'commands')); // Register new commands

        // Set up binds to emitted events from super class
        this.on('ready', this.ready.bind(this));

        this.login(config.token);
    }

    /**
     * Called when the bot first establishes a connection with the discord api and is ready to work
     * @returns {Promise<void>}
     */
    async ready() {
        console.log(`Logged in as ${this.user.tag}`);
    }

    /**
     * Logs out, terminates the connection to Discord, and destroys the client.
     */
    destroy() {
        console.log(`Logging out of ${this.user.tag}`);
        return super.destroy();
    }
}

module.exports = DiscordBot;