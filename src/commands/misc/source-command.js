/**
 * @author Conlan Cesar
 * @date 5/12/2020
 * @desc Source file for `!source` command class
 */

// Modules
const Command = require('../command');

/**
 * @desc SourceCommand singleton that defines behavior for the `!source` command.
 */
class SourceCommand extends Command {
    /**
     * Default constructor for SourceCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'source',
            group: 'misc',
            aliases: ['license', 'info', 'bugs'],
            description: 'Prints out link to source code.',
            examples: ['!source'],
        });
    }

    /**
     * Gets bot source, homepage, license, etc and prints it out
     * @param msg The message that triggered the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        let pjson = require('./package.json');
        let home = pjson.homepage;
        let license = pjson.license;
        let bugsURL = pjson.bugs.url;
        
        let message = "I'm not sure where I live, sorry! Please contact an admin.";
        
        if (home || license || bugs) message = "";
        
        if (home) message += `A link to my source code can be found here: ${home}.`;
        if (license) message += `\nI am licensed under the ${license}.`;
        if (bugs) message += `\nIf you find a bug, you can report it to an admin, or make a ticket here: ${bugsURL}`;
        
        msg.reply(message.trim());
    }
}

module.exports = SourceCommand;
