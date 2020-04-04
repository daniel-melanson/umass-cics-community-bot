/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for `!roles` command class
 */

// Modules
const { oneLine } = require('common-tags');
const Command = require('../command');
const util = require('../../command-util');

/**
 * @desc RolesCommand singleton that defines behavior for the `!roles` command.
 */
class RolesCommand extends Command {
    /**
     * Default constructor for RolesCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'roles',
            group: 'roles',
            properName: 'Roles',
            description: 'Lists out the available roles that users can assign themselves',
            guildOnly: true,
            examples: ['!roles'],
        });
    }

    /**
     * Fetches all the roles in the requesting message's guild, sorts assignable roles into categories and displays.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        // Update our RoleManager to have any new roles that might
        // be in the cache
        let cache = await msg.guild.roles.fetch();

        // Filter, sort, and map a range of roles
        let fetchRoles = (check) => {
            return cache.filter(r => check(r.name))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(r => r.name);
        };

        // Define arrays for each category
        let gradClassOrStatus = fetchRoles(util.isGraduatingStatus);
        let resAreas = fetchRoles(util.isResidential);
        let csCourses = fetchRoles(util.isCSClass);
        let mathCourses = fetchRoles(util.isMathClass);
        let interdisciplinary = fetchRoles(util.isInterdisciplinary);
        let misc = fetchRoles(util.isMisc);

        // Display the roles in a visually pleasing way
        return msg.reply(this.client.generateEmbed({
            title: "List of Assignable Roles",
            description: oneLine(`The following categories list out the available roles that users can assign themselves using the \`!role [role name]\` command. 
                These roles grant users permission to related channels. If you would like access to all related channels, you may assign yourself the \`Snooper\` role.`),
            fields: [
                {
                    name: "Graduating Class or Graduation Status",
                    value: gradClassOrStatus.join(', ')
                },
                {
                    name: "Residential Areas",
                    value: resAreas.join(', ')
                },
                {
                    name: "Computer Science Courses",
                    value: csCourses.join(', ')
                },
                {
                    name: "Math Courses",
                    value: mathCourses.join(', ')
                },
                {
                    name: "Interdisciplinary",
                    value: interdisciplinary.join(', ')
                },
                {
                    name: "Miscellaneous",
                    value: misc.join(', ')
                }
            ]
        }));
    }
}

module.exports = RolesCommand;
