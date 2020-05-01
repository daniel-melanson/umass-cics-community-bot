/**
 * @author Daniel Melanson
 * @date 5/1/2020
 * @desc Source file for `!lock` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc UnlockCommand singleton that defines behavior for the `!lock` command.
 */
class UnlockCommand extends Command {
    /**
     * Default constructor for UnlockCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'unlock',
            group: 'admin',
            description: 'Removes restrictions that prevented users from typing.',
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: ['MANAGE_CHANNELS'],
            examples: ['!unlock'],
            guildOnly: true,
        });
    }

    /**
     * Removes restrictions that prevented users from typing
     * @param msg The message that requested the command
     * @param args The arguments of the message
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        let channel = msg.channel;
        try {
            await channel.createOverwrite(msg.guild.roles.everyone, {
                VIEW_CHANNEL: false,
            });
        } catch(e) {
            return msg.reply(` I was unable to change the permissions of the channel. Make sure that I have permissions to do so.`);
        }

        return channel.send(`@here This channel has now been unlocked.`);
    }
}

module.exports = UnlockCommand;
