/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for `!role [role name]` command class
 */

// Modules
const Command = require('../command');
const util = require('../../util.js');

function nameFilterExact(search) {
    return thing => thing.name.toLowerCase() === search;
}

function nameFilterInexact(search) {
    return thing => thing.name.toLowerCase().includes(search);
}

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
            description: 'Allows for users to assign themselves or remove themselves from an assignable role.',
            clientPermissions: ['MANAGE_ROLES'],
            guildOnly: true,
            examples: ['!role CS 121'],
            args: [
                {
                    key: 'role',
                    prompt: 'Which class/residence role?',
                    // Remove the validation so users do not get multiple prompts
                    validate: () => true,
                    parse: async (val, msg) => {
                        // Taken from the discord.js-commando library, edited so I can look for roles without a space
                        const matches = val.match(/^(?:<@&)?([0-9]+)>?$/);

                        if (matches) return msg.guild.roles.get(matches[1]) || null;

                        const search = val.toLowerCase();
                        let roles = msg.guild.roles.filter(nameFilterInexact(search));

                        if (roles.size === 0 && util.isClass(val)) {
                            let letters = val.match(/[a-z]+(?=\d)/i), numbers = val.match(/(?<=\D)\d.+/i);

                            if (!letters[0] || !numbers[0])
                                return null;

                            roles = msg.guild.roles.filter(nameFilterExact(`${letters[0]} ${numbers[0]}`));
                        }

                        if(roles.size === 0) return null;

                        if(roles.size === 1) return roles.first();

                        const exactRoles = roles.filter(nameFilterExact(search));
                        if(exactRoles.size === 1) return exactRoles.first();

                        return null;
                    }
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
            return msg.reply('I can not seem to find that role. Use the `!roles` command to see a list of assignable roles.');

        if (!util.isAssignable(role.name))
            return msg.reply('That is not an assignable role. Use the `!roles` command to find some.');

        // Check to see if the assignable role has an exploitable feature
        if (util.hasExploitable(role.permissions)) {
            let success = false;

            try {
                await util.resetPermissions(role);
                success = true;
            } catch(e) {}

            // Alert the admins
            this.client.logMessage({
                type: 'WARN',
                message: `The ${role.name} role being assigned to ${msg.author.tag}. ${role.name} ${success ? 'previously had' : 'has'} an exploitable feature.`
            });

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
