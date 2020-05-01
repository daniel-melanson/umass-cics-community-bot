/**
 * @author Daniel Melanson
 * @date 5/1/2020
 * @desc Source file for `!lock` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc LockCommand singleton that defines behavior for the `!lock` command.
 */
class LockCommand extends Command {
    /**
     * Default constructor for LockCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'lock',
            group: 'admin',
            description: 'Disables users from sending messages in the requesting channel.',
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: ['MANAGE_CHANNELS'],
            examples: ['!lock Locked for testing. Will be unlocked in a day.'],
            guildOnly: true,
            args: [
                {
                    key: 'reason',
                    prompt: 'What is the reason for locking the channel?',
                    type: 'string',
                    default: 'This channel has been locked by an administrator. They did not specify the reason.'
                }
            ]
        });
    }

    /**
     * Prevents users from talking in the channel the command was sent
     * @param msg The message that requested the command
     * @param args The arguments of the message
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        let channel = msg.channel;

        try {
            await channel.createOverwrite(msg.guild.roles.everyone, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false
            });
        } catch(e) {
            return msg.reply(` I was unable to change the permissions of the channel. Make sure that I have permissions to do so.`);
        }

        return channel.send(this.client.generateEmbed({
            title: 'This channel is currently locked.',
            description: args.reason,
            time: true
        }));
    }
}

module.exports = LockCommand;
