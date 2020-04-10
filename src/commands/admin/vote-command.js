/**
 * @author Daniel Melanson
 * @date 4/10/2020
 * @desc Source file for `!vote` command class
 */

// Modules
const Command = require("../command");

/**
 * @desc VoteCommand singleton that defines behavior for the `!vote` command.
 */
class VoteCommand extends Command {
    constructor (client) {
        super(client, {
            name: 'vote',
            group: 'admin',
            properName: 'Vote',
            description: 'Creates an embedded yes or no question.',
            guildOnly: true,
            clientPermissions: ['MANAGE_MESSAGES'],
            userPermissions: ['ADMINISTRATOR'],
            examples: [`!vote #general 'Would you participate in this?'`],
            args: [
                {
                    key: 'channel',
                    prompt: 'Where would you like to post the vote?',
                    type: 'channel',
                    wait: 60
                },
                {
                    key: 'question',
                    prompt: 'What is the question?',
                    type: 'string',
                    validate: (arg) => {
                        return arg.endsWith(`?`) ? true : 'the vote must be a question';
                    },
                    wait: 120
                }
            ]
        });
    }

    /**
     * Creates a yes/no reaction based vote.
     * @param msg The message the command was triggered from
     * @param args The arguments that were processed
     * @returns {Promise<Message|Message[]|Message|Message[]|*>}
     */
    async fn (msg, args) {
        // Make sure we were able to parse correctly
        if (!args.channel)
            return msg.reply('unable to find channel.');

        if (!args.question)
            return msg.reply('you must supply a question,');

        let emojis = msg.guild.emojis;
        let upvote = emojis.find(emoji => emoji.name === 'upvote');
        if (!upvote)
            return msg.reply('unable to find upvote emoji. Make sure the guild has one.');

        let downvote = emojis.find(emoji => emoji.name === 'upvote');
        if (!downvote)
            return msg.reply('unable to find downvote emoji. Make sure the guild has one.');

        let author = msg.author;
        let embed = this.client.generateEmbed({
            author: {
                name: msg.member.nickname || author.username,
                iconURL: author.avatarURL()
            },
            title: args.question,
            description: "If you agree or answer yes to this question, react with an upvote. If you disagree please react with a downvote.",
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

                    await msg.react(upvote);
                    await msg.react(downvote);
                } catch(e) { // If we could not set up the poll
                    await msg.reply('Unable to set up poll. Make sure I have the correct permissions.')
                }
            }
        });

        await confirmation.react('✅');
    }
}

module.exports = VoteCommand;