/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for `!role [role name]` command class
 */

// Modules
const Command = require('../command');
const util = require('../../util.js');

/**
 * @desc RoleCommand singleton that defines behavior for the `!role [role name]` command.
 */
class RoleCommand extends Command {
    /**
     * Default constructor for RoleCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'role',
            group: 'roles',
            properName: 'Role',
            description: 'Allows the user to assign themselves one of the assignable roles.',
            guildOnly: true,
            examples: ['!role CS 121'],
            args: [
                {
                    key: 'role',
                    label: 'role',
                    prompt: 'Which class/residence role?',
                    type: 'role'
                }
            ]
        });
    }

    /**
     * Assigns the user the specified role, or removes that role from the user if they already have it.
     * @param msg The message that requested the command
     * @param args The arguments of the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        let role = args.role;

        if (!role)
            return msg.reply("I can not seem to find that role. User the `!roles` command to see a list of assignable roles.");

        if (!util.isAssignable(role.name))
            return msg.reply("That is not an assignable role. Use the `!roles` command to find some.");

        // IDE does inspection and it is wrong
        // noinspection JSCheckFunctionSignatures
        if (util.hasExploitable(role.permissions)) { // Check to see if the assignable role has an exploitable feature
            let success = await util.resetPermissions(role);

            // Alert the admins
            this.client.logMessage('WARN', `@everyone Caught the ${role.name} role being assigned to ${msg.author.tag}. ${role.name} ${success ? 'previously had' : 'has'} an exploitable feature.`);

            // Tell the user why they did not get the role
            return msg.reply(`unable to provide role. You should not see this error. If you do, contact an admin ASAP.`);
        }

        // Try and get guild member
        let guildMember = msg.member;
        if (!guildMember) // User might have left before we were able to process command
            return msg.reply(`unable to find guild member. Guess the user left.`);

        // If the user has the role already, try to remove the role
        if (guildMember.roles.has(role.id)) {
            try {
                await guildMember.roles.remove(role);
                return msg.reply(`removed your ${role.name} role.`);
            } catch(e) {
                return msg.reply(`unable to remove your ${role.name} role.`);
            }
        } else { // If they do not have the role, then try and give it to them
            try {
                await guildMember.roles.add(role);
                return msg.reply(`you now have the ${role.name} role.`);
            } catch(e) {
                return msg.reply(`it seems that I do not have permission to give you that role`);
            }
        }
    }
}

module.exports = RoleCommand;
