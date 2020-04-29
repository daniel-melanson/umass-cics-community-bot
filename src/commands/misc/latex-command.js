/**
 * @author Daniel Melanson
 * @date 4/29/2020
 * @desc Source file for `!latex` command class
 */

// Modules
const Command = require('../command');
const fetch = require('node-fetch');

/**
 * @desc LatexCommand singleton that defines behavior for the `!latex` command.
 */
class LatexCommand extends Command {
    /**
     * Default constructor for LatexCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'latex',
            group: 'misc',
            description: 'Generates and sends a latex image.',
            examples: ['!latex y = \\sum_{x=0}^{10} x^5'],
            args: [
                {
                    key: 'latex',
                    prompt: 'What latex would you like to generate?',
                    type: 'string'
                }
            ]
        });
    }

    /**
     * Fetches and displays an LaTeX image
     * @param msg The message that triggered the command
     * @param args The arguments of the command
     * @returns {Promise<void>}
     */
    async fn(msg, args) {
        const form = new URLSearchParams();

        let reply = await msg.reply(` processing...`);

        form.append('latexInput', args.latex);
        form.append('outputScale', '500%');
        form.append('outputFormat', 'JPG');

        let image, error = 'There were no fatal errors.';
        try {
            let res = await fetch(`https://latex2image.joeraut.com/convert`, {
                method: 'POST',
                body: form
            });

            let json = await res.json();

            if (json.imageURL)
                image = `https://latex2image.joeraut.com/${json.imageURL}`
            else if (json.error)
                error = json.error;

        } catch(e) {
            error = e.message;
        }

        await reply.delete();

        if (image) {
            return msg.channel.send({
               files: [{
                   attachment: image,
                   name: 'latex.jpg'
               }]
            });
        } else {
            return msg.reply(` I was unable to compile that LaTeX. ${error}`);
        }
    }
}

module.exports = LatexCommand;
