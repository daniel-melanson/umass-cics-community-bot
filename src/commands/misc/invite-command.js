/**
 * @author Daniel Melanson
 * @date 4/11/2020
 * @desc Source file for `!invite` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc InviteCommand singleton that defines behavior for the `!invite` command.
 */
class InviteCommand extends Command {
    /**
     * Default constructor for InviteCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'invite',
            group: 'misc',
            properName: 'invite',
            description: 'Generates a permanent invite.',
            clientPermissions: ['CREATE_INSTANT_INVITE'],
            examples: ['!invite'],
            guildOnly: true
        });
    }

    /**
     * Generates a permanent invite.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        let guild = msg.guild;

        let welcome = guild.channels.find(c => c.name === "welcome");

        if (!welcome)
            return msg.reply("unable to find welcome channel. Make sure I can see that channel.");

        let invite;
        try {
            invite = await welcome.createInvite({
                maxAge: 0
            });

            return msg.reply(`Here is a permanent invite to this discord: ${invite}`)
        } catch(e) {
            return msg.reply("unable to create invite. Make sure I can generate invites for the welcome channel.");
        }
    }
}

module.exports = InviteCommand;
