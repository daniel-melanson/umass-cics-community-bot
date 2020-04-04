/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for abstract command class
 */

// Modules
const Commando = require('discord.js-commando');

/**
 * Abstract Command class that all commands inherit.
 */
class Command extends Commando.Command {
    /**
     * Initializes a new Command sub-object
     * @param client The CommandoClient that the command is registered to
     * @param info The CommandInfo about the command
     */
    constructor(client, info) {
        info.autoAliases = false;
        info.memberName = info.name;
        info.guildonly = info.guildonly || true;

        // Throttle commands to <=5 per minute
        info.throttling = {
            usages: 5,
            duration: 60
        };

        super(client, info);
    }

    hasPermission(message, ownerOverride) {
        return this.client.isOwner(message.author);
    }

    /**
     * Wrapper of the super.run() method
     * @param msg
     * @param args
     * @param fromPattern
     * @param result
     * @returns {Promise<void>}
     */
    async run(msg, args, fromPattern, result) {
        return this.fn(msg, args, fromPattern, result);
    }
}

module.exports = Command;