/**
 * @author Daniel Melanson
 * @date 5/4/2020
 * @desc Source file for `!reset-classes` command class
 */

// Modules
const Command = require('../command');
const { isClass } = require('../../util.js');

/**
 * @desc ResetClassesCommand singleton that defines behavior for the `!reset-classes` command.
 */
class ResetClassesCommand extends Command {
    /**
     * Default constructor for ResetClassesCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'reset-classes',
            group: 'roles',
            description: 'Removes a users class related roles.',
            clientPermissions: ['MANAGE_ROLES'],
            examples: ['!reset-classes'],
            guildOnly: true,
        });
    }

    /**
     * Removes a users class related roles.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        let member = msg.member;

        for (let role of member.roles.array()) {
            if (isClass(role.name))
                await member.roles.remove(role);
        }

        return msg.reply(` I removed all your class related roles.`);
    }
}

module.exports = ResetClassesCommand;
