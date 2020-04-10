/**
 * @author Daniel Melanson
 * @date 4/6/2020
 * @desc Source file for `!say` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc SayCommand singleton that defines behavior for the `!say` command.
 */
class SayCommand extends Command {
    /**
     * Default constructor for SayCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'say',
            group: 'admin',
            properName: 'say',
            description: 'Prints an embedded message with the server rules.',
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: ['SEND_MESSAGES'],
            examples: ['!say Hello!'],
            args: [
                {
                    key: 'phrase',
                    prompt: 'What would you like me to say?',
                    type: 'string'
                }
            ]
        });
    }

    /**
     * Repeats the contents of the requesting message.
     * @param msg The message that requested the command
     * @param args The arguments of the message
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        await msg.delete();
        return msg.channel.send(args.phrase);
    }
}

module.exports = SayCommand;
