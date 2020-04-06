/**
 * @author Daniel Melanson
 * @date 4/6/2020
 * @desc Source file for `!addcourse` command class
 */

// Modules
const Command = require("../command");
const util = require("../../util");

/**
 * @desc AddCourseCommand singleton that defines behavior for the `!addcourse` command.
 */
class AddCourseCommand extends Command {
    /**
     * Default constructor for AddCourseCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: "addcourse",
            group: "admin",
            properName: "Add Course",
            description: "Creates a new role and channel and sets up permissions.",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["ADMINISTRATOR"],
            examples: ["!addcourse"],
            args: [
                {
                    key: "id",
                    label: "id",
                    prompt: "What is the ID of the course? (Example: CS 187)",
                    type: "string",
                    validate: (str) => {
                        if (!util.isClass(str))
                            return "That is not a valid course ID. Please put it in the following format: [course topic][course number, optional letters]";
                        else
                            return true;
                    },
                    wait: 0
                },
                {
                    key: "title",
                    label: "title",
                    prompt: "What is the title of the course? (Example: Programming With Data Structures)",
                    type: "string",
                    wait: 0
                }
            ]
        });
    }

    /**
     * Generates a new role and channel for a course. Sets up permissions for those as well.
     * @param msg The message that requested the command
     * @param args An object of arguments passed to the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        let guild = this.client.guild;

        let id = args.id;

        // Get the course topic Ex. CS from CS187
        let topic = id.match(/^[a-z]+/i)
            .toString()
            .toUpperCase();

        // Get course number Ex 187b from CS 187b
        let number = id.match(/\d{3}[a-z]*$/i)
            .toString()
            .toUpperCase();

        // Create new string with space
        id = `${topic} ${number}`;

        // Fetch all the roles in the guild
        let roles = await guild.roles.fetch();

        // Find the separating role that keeps all roles aligned
        let separator = roles.find(r => r.name === `---- ${topic} ----`);
        if (!separator)
            return msg.reply(`unable to find the separator role for topic ${topic}`);

        // If there is already a role, then we should tell the user so they can handle it
        if (roles.find(r => r.name === id))
            return msg.reply(`unable to create role. There is already a role named ${id}.`);

        // Attempt to create a role
        let role;
        try {
            role = await roles.create({
                data: {
                    name: id,
                    permissions: [],
                    position: separator.position
                },
                reason: "Automatic course creation."
            });
        } catch(e) {
            return msg.reply("unable to create role. This might be because the bot role is too low on the role list.");
        }

        let channels = guild.channels;

        // Find the category to place the new channel under
        let category = channels.find(c => c.type === 'category' && !!c.name.match(new RegExp(`\\W+${topic} classes`, 'i')));
        if (!category)
            return msg.reply("unable to find category. Role created without channel.");


        // Update the overwrites on the category so non-course channels in that category can been seen with the new role
        await category.updateOverwrite(role, {
            VIEW_CHANNEL: true
        });

        let channel;
        
        try {
            channel = await guild.channels.create(number, {
                type: "text",
                parent: category,
                topic: args.title
            });
        } catch (e) {
            return msg.reply("unable to create channel. Make sure that I have the correct permissions.");    
        }

        try {
            await channel.edit({
                lockPermissions: false,
                permissionOverwrites: []
            });

            let snooper = roles.find(r => r.name === "Snooper");
            if (snooper) {
                await channel.updateOverwrite(snooper, {
                    VIEW_CHANNEL: true
                });
            }

            await channel.updateOverwrite(roles.everyone, {
                VIEW_CHANNEL: false
            });

            await channel.updateOverwrite(role, {
                VIEW_CHANNEL: true
            });
        } catch (e) {
            return msg.reply("unable to set permissions on the new channel.");
        }
        
        return msg.reply("created the new channel and role. Positioning is not handled.");
    }
}

module.exports = AddCourseCommand;
