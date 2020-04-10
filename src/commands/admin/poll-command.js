/**
 * @author Daniel Melanson
 * @date 4/10/2020
 * @desc Source file for `!poll` command class
 */

// Modules
const Command = require('../command');

// Constants
const REACTION_EMOJIS = [
    "🇦",
    "🇧",
    "🇨",
    "🇩",
    "🇪",
    "🇫",
    "🇬",
    "🇭",
    "🇮",
    "🇯",
    "🇰",
    "🇱",
    "🇲",
    "🇳"
];

/**
 * @desc PollCommand singleton that defines behavior for the `!poll` command.
 */
class PollCommand extends Command {
    /**
     * Default constructor for PollCommand object.
     * @param client The discord-js-commando.Client class that the command is registered to
     */
    constructor(client) {
        super(client, {
            name: 'poll',
            group: 'admin',
            properName: 'poll',
            description: 'Creates a poll for users to vote via reaction.',
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: ['ADMINISTRATOR'],
            examples: [`!poll #welcome 'Which do you think is better?' 'A.' 'B.' 'C.'`],
            guildOnly: true,
            args: [
                {
                    key: 'channel',
                    prompt: 'Which channel do I poll?',
                    type: 'channel',
                    wait: 120
                },
                {
                    key: 'question',
                    prompt: 'What is the question of the poll?',
                    type: 'string',
                    validate: (arg) => {
                        return new RegExp(/^.+\?$/i).test(arg);
                    },
                    wait: 120
                },
                {
                    key: 'responses',
                    prompt: 'What are the responses to the question?',
                    type: 'string',
                    infinite: true,
                    wait: 120
                }
            ]
        });
    }

    /**
     * Creates a poll for users to react to.
     * @param msg The message that requested the command
     * @param args The arguments of the message
     * @returns {Promise<Message|Message[]|*>}
     */
    async fn(msg, args) {
        // Make sure we were able to parse correctly
        if (!args.channel)
            return msg.reply('unable to find channel.');

        if (!args.question)
            return msg.reply('you must supply a question,');

        if (!args.responses || args.responses.length <= 1)
            return msg.reply('you need to supply a response to the question.');

        let responses = args.responses;

        // Set up a test embed
        let fields = [];
        for (let i = 0; i < responses.length; i++) {
            fields.push({
                value: "‎‎",
                name: `${REACTION_EMOJIS[i]} **${responses[i].trim()}**`
            })
        }

        let author = msg.author;
        let embed = this.client.generateEmbed({
            author: {
                name: msg.member.nickname || author.username,
                iconURL: author.avatarURL()
            },
            title: args.question,
            description: "Please react to this message with your response.",
            fields: fields,
            time: true
        });

        // Let the author choose to send out the poll or not
        let confirmation = await msg.channel.send('Is this ok? Expires in 30 seconds.', embed);

        // Collect reactions from the message, if the reactions are from the creator of the poll
        let collector = confirmation.createReactionCollector((reaction, user) => user.id === author.id, {
            time: 30000
        });

        // Once we collect a reaction
        collector.on('collect', async reaction => {
            if (reaction.emoji.name === '✅') {
                try { // Try and send the poll out to the channel
                    let msg = await args.channel.send('@everyone', embed);

                    for (let i = 0; i < responses.length; i++) {
                        await msg.react(REACTION_EMOJIS[i]);
                    }
                } catch(e) { // If we could not set up the poll
                    await msg.reply('Unable to set up poll. Make sure I have the correct permissions.')
                }
            }
        });

        await confirmation.react('✅');
    }
}

module.exports = PollCommand;
