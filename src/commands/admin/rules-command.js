/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for `!rules` command class
 */

// Modules
const { oneLine } = require("common-tags");
const Command = require("../command");

/**
 * @desc RulesCommand singleton that defines behavior for the `!rules` command.
 */
class RulesCommand extends Command {
    /**
     * Default constructor for RulesCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: "rules",
            group: "admin",
            properName: "rules",
            description: "Prints an embedded message with the server rules.",
            guildOnly: true,
            userPermissions: ["ADMINISTRATOR"],
            clientPermissions: ["SEND_MESSAGES"],
            examples: ["!rules"],
        });
    }

    /**
     * Prints an embedded message with the server rules.
     * @param msg The message that requested the command
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg) {
        await msg.delete();
        return msg.channel.send(this.client.generateEmbed({
            description: oneLine(`By joining this discord server, you are bounded to the following rules. 
            **Failure to follow these rules will result in punishment.** 
            This discord server is not associated with the College of Information and Computer Sciences or the University of Massachusetts at Amherst.`),
            thumbnail: {
                iron_url: this.client.user.avatarURL
            },
            fields: [
                {
                    name: `Rule 1: Observe the \"Golden Rule\"`,
                    value: "Do unto others as you would have them do unto you."
                },
                {
                    name: "Rule 2: Absolutely **zero** Not Safe For Work content (NSFW)",
                    value: "There is no reason to have it in this discord. Take it to DMs. This includes: intense conversations about politics or religion, sexual innuendos or references, slurs. Light swearing is fine. But do not get carried away."
                },
                {
                    name: "Rule 3: Do not abuse the bot and/or bot commands",
                    value: "The bot has feelings too."
                },
                {
                    name: "Rule 4: Follow the UMass Academic Honesty Policy",
                    value: "This includes talking about exam solutions before the solutions are released publicly. All instances of cheating will be reported. You can find more information about this rule [here](https://www.umass.edu/honesty/). "
                },
                {
                    name: "Rule 5: Each user must have their nickname set to their real name",
                    value: "If you don't know how to do this, then ping an admin to change it for you."
                }
            ],
        }));
    }
}

module.exports = RulesCommand;
