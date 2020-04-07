/**
 * @author Daniel Melanson
 * @date 4/7/2020
 * @desc Source file for `!classes` command class
 */

// Modules
const Command = require('../command');
const { oneLine } = require('common-tags');
const courseInfo = require('../../course-information');

/**
 * @desc ClassListCommand singleton that defines behavior for the `!classes` command.
 */
class ClassListCommand extends Command {
    /**
     * Default constructor for ClassListCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'classes',
            group: 'classes',
            properName: 'classes',
            description: 'Prints a list of all the classes that CICS offers',
            clientPermissions: ['SEND_MESSAGES'],
            examples: ['!classes'],
        });
    }

    /**
     *
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        try {
            let classList = await courseInfo.getClassList();
            let list = classList.sort((a, b) => a.localeCompare(b));

            let join = (l, regExp) => {
                return l.filter(s => !!s.match(regExp))
                    .join(', ');
            };

            let csList = list.filter(s => !!s.match(/^cs/i));
            let infoList = join(list, (/^info/i));
            let cicsList = join(list, /^cics/i);

            await msg.reply(this.client.generateEmbed({
                title: "UMass CICS Course List",
                description: oneLine(`The following list is a collection of all the offered courses from the spring 2018 semester onwards. 
                Some courses on this list might not be offered anymore. To gain information about a course simply say \`What is [course id]?\` and the bot will reply with information.`),
                fields: [
                    {
                        name: "Computer Science 100s Level",
                        value: join(csList, / 1/)
                    },
                    {
                        name: "Computer Science 200s Level",
                        value: join(csList, / 2/)
                    },
                    {
                        name: "Computer Science 300s Level ",
                        value: join(csList, / 3/)
                    },
                    {
                        name: "Computer Science 400s Level",
                        value: join(csList, / 4/)
                    },
                    {
                        name: "Computer Science 500s Level",
                        value: join(csList, / 5/)
                    },
                    {
                        name: "Computer Science 600+s Level",
                        value: join(csList, / [6-9]/)
                    },
                    {
                        name: "Informatics",
                        value: infoList
                    },
                    {
                        name: "College of Information and Computer Sciences",
                        value: cicsList
                    }
                ]
            }));
        } catch (e) {
            return msg.reply('it seems that I was unable to get information about the courses. Try again later. If this problem persists, contact an admin.');
        }
    }
}

module.exports = ClassListCommand;
