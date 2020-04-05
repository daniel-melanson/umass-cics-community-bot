/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for `!verify` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc VerifyCommand singleton that defines behavior for the `!verify` command.
 */
class VerifyCommand extends Command {
    /**
     * Default constructor for VerifyCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'verify',
            group: 'admin',
            properName: 'Verify',
            description: 'Gives the user the verified role if their name matches',
            guildOnly: true,
            examples: ['!verify']
        });
    }

    /**
     * Checks to see if the user's nickname or username is a valid name.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        await msg.delete();

        // Attempt to get role
        let role = msg.guild.roles.find(r => r.name === 'Verified');
        if (!role)
            return msg.reply(`unable to find verified role.`);

        // Attempt to get GuildMember
        let member = msg.member;
        if (!member)
            return msg.reply(`unable to find member. Guess they left the server.`);

        // If the user already has the verified role then there is no reason to do such things
        if (member.roles.has(role.id))
            return;

        // If the name is not in a acceptable format then log it
        let name = member.nickname || msg.author.username;
        if (!(new RegExp(/^(([a-z]+[,.]?[ ]?|[a-z]+['-]?)+)$/i).test(name)))
            this.client.logMessage('WARN', `User ${msg.author.tag} might not have an acceptable name. ${member.nickname ? `Their nickname is ${member.nickname}` : 'They do not have a nickname'}.`);

        // Give the user the role
        try {
            await member.roles.add(role);
        } catch(e) {
            return this.client.logMessage('ERROR', `Tried to give the member the verified role ${e.toString()}`);
        }

        return await this.client.registry.resolveCommand('roles').fn({
            author: msg.author,
            guild: msg.guild,
            fakeChannel: msg.guild.channels.find(c => c.name === 'bot-commands')
        });
    }
}

module.exports = VerifyCommand;
