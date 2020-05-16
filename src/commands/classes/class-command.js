/**
 * @author Daniel Melanson
 * @date 4/6/2020
 * @desc Source file for special class command command class
 */

// Modules
const Command = require('../command');
const courseInfo = require('../../course-information');
const mathCourseInfo = require('../../course-information-math')

/**
 * @desc ClassCommand singleton that defines behavior for the special class command
 */
class ClassCommand extends Command {
    /**
     * Default constructor for ClassCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'class',
            group: 'classes',
            description: 'Fetches info about a class and reply with an embedded message.',
            examples: ['!cs121'],
            clientPermissions: ['SEND_MESSAGES'],
            defaultHandling: false,
            patterns: [/^what is\s+(cs|info|cics|math|stat)\s*(\d{3}[a-z]*\d?)/i, ],
        });
    }

    /**
     * Fetches info about a class and reply with an embedded message.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        let matches = msg.patternMatches;

        // If we did not match both, then return
        if (!matches[1] || !matches[2])
            return;

        // Form an id from the patterns
        let topic = matches[1].toUpperCase();
        let number = matches[2].toUpperCase();
        let id = `${topic} ${number}`;

        // Attempt to get class info
        let info;

        switch (topic) {
            case "MATH":
            case "STAT":
                try {
                    await mathCourseInfo.getMathClass(id).then((res) => info = res);
                } catch (e) {
                    return;
                }
                break;
            case "CS":
            case "CICS":
            case "INFO":
                try {
                    info = await courseInfo.getClass(id);
                } catch (e) {
                    return;
                }
                break;
            default:
                console.error("ERROR: class-command.js – " + topic + "is not a valid topic!");
        }

        // If we have something to display
        if (info) {
            return msg.reply(this.client.generateEmbed({
                title: `${info.name}: ${info.title}`,
                description: info.description,
                fields: [
                    {
                        name: 'Instructors',
                        value: info.instructors
                    },
                    {
                        name: 'Most Recent Semester',
                        value: info.semester,
                    }
                ],
            }));
        }
    }
}

module.exports = ClassCommand;
