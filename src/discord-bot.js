/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Source file for the singleton DiscordBot class
 */

// Modules
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const path = require('path');
const util = require('./util.js');
const { oneLine } = require("common-tags");

// Constants for embed generation
const EMBED_CONSTANTS = {
    NAME: 'University of Massachusetts Amherst College of Information and Computer Sciences',
    COLOR:  [131, 35, 38]
};

/**
 * Singleton class that manages command registry + execution, message filtering, and memes.
 */
class DiscordBot extends Commando.Client {
    /**
     * Creates a new DiscordBot.
     * @param config An object with fields:
     *  config.owner The user ID of the bot's owner.
     *  config.commandPrefix The prefix to all commands, optional.
     *  config.token The bot token used to communicate with the discord api
     */
    constructor(config) {
        super({
            owner: config.owner,
            commandPrefix: config.commandPrefix || '!',
            nonCommandEditable: false
        });

        // Register new groups to categorize the commands with
        this.registry.registerGroups([
            ['admin', 'Administrative'],
            ['roles', 'Roles'],
            ['classes', 'classes'],
            ['misc', 'Miscellaneous']
        ])
            .registerDefaults() // Register default types and commands
            .registerCommandsIn(path.join(__dirname, 'commands')); // Register new commands

        // Set up binds to emitted events from super class
        this.on('ready', this.ready.bind(this));
        this.on('roleUpdate', this.roleUpdate.bind(this));

        this.login(config.token);
    }

    /**
     * Attempts to log a message if there is a log channel
     * @param {'ERROR'|'WARN'|'MSG'} type The type of message to log
     * @param {string} message The message to log
     * @returns {Promise<*>}
     */
    async logMessage(type, message) {
        if (this.log)
            return await this.log.send(`${type}: ${message}`);
    }

    /**
     * Generates a new embed object
     * @param options
     * @returns {object}
     */
    generateEmbed(options) {
        let embed = new Discord.MessageEmbed({
            createdAt: options.createdAt,
            description: options.description,
            fields: options.fields,
            image: options.image,
            title: options.title,
            footer: options.footer
        });

        if (options.author)
            embed.setAuthor(options.author.name, options.author.iconURL, options.author.url);
        else
            embed.setAuthor(this.user.username, this.user.avatarURL());

        embed.setColor(options.hexColor ? options.hexColor : EMBED_CONSTANTS.COLOR);

        if (options.time)
            embed.setTimestamp(new Date());

        return {embed: embed};
    }

    /**
     * Called when a role in the discord server is updated
     * @param {Role} oldRole
     * @param {Role} newRole
     */
    async roleUpdate(oldRole, newRole) {
        if (util.hasExploitable(newRole.permissions) && util.isAssignable(newRole.name)) {
            let success = await util.resetPermissions(newRole);

            if (this.log)
                await this.logMessage('WARN', `The ${newRole.name} has been updated and it ${success ? 'had' : 'has'} an exploitable feature.`);
        }
    }

    /**
     * Called when the bot first establishes a connection with the discord api and is ready to work.
     * @returns {Promise<void>}
     */
    async ready() {
        console.log(`Logged in as ${this.user.tag}`);

        this.guild = this.guilds.get("574287921717182505");

        if (!this.guild) {
            console.log("Unable to find main guild");
            this.destroy();
        }

        let channels = this.guild.channels;
        this.log = channels.find(c => c.name === "bot-log" && c.type === "text");
        this.welcome = channels.find(c => c.name === "welcome" && c.type === "text");

        this.setupVerification();
    }


    /**
     * Sets up user verification
     * @returns {Promise<void>}
     */
    async setupVerification() {
        let channel = this.welcome;
        let verifiedRole = this.guild.roles.find(r => r.name === "Verified");
        let botCommands = this.guild.channels.find(c => c.name === 'bot-commands');

        await channel.bulkDelete(await this.welcome.messages.fetch());

        let verifyMessage = await channel.send(this.generateEmbed({
            title: "Welcome to the University of Massachusetts College of Information and Computer Sciences Community Discord Server!",
            description: oneLine(`This server is a gathering of UMass CICS prospects, students, and alumni. 
                Members can discuss the material of a current class, show off their extracurricular projects, or talk about issues facing the computer science community. 
                To help foster this community, **we ask all of our members to associate themselves with a real-life name.** 
                Gamer-tags are pretty neat, but it gets very confusing when we have a community of hundreds of people. 
                **If you are uncomfortable with using your formal first name, we encourage you to use a pet name or nickname.** 
                To get started, follow the instructions based on your device:`),
            fields: [
                {
                    name: "*Desktop*",
                    value: "Click on `UMass CICS Community` in bold in the top left of your screen. Press `Change Nickname`, enter your identifier, and `Save`.",
                    inline: true
                },
                {
                    name: "*Mobile*",
                    value: "Swipe to the right to display your sever list. Press the three vertically aligned dots next to `UMass CICS Community`. Press `Change Nickname`, enter your identifier, and `Save`.",
                    inline: true
                },
                {
                    name: "**Next Steps**",
                    value: oneLine(`**Once you are done setting your nickname, react to this message with the check-mark.**
                    This tells the bot that you are ready to enter the server. Keep in mind that we track the users that verify.
                    If you have an unfavorable name, you are subject to moderation. Once you verify, the bot will be waiting for you in the #bot-commands channel for next steps. Enjoy!`),
                }
            ],
            footer: {
                icon_url: this.user.avatarURL(),
                test: "UMass CICS Community"
            },
            time: true,
        }));

        let collector = verifyMessage.createReactionCollector((reaction, user) => user.id !== this.user.id, {
            dispose: true
        });

        collector.on('collect', async (r, user) => {
            let guildMember = await this.guild.members.fetch(user);

            if (guildMember) {
                await guildMember.roles.add(verifiedRole);

                this.logMessage('MSG', `Just verified the user ${user.tag}. Their identifier is ${guildMember.nickname ? guildMember.nickname : user.username}.`);

                await this.registry.resolveCommand('roles').fn({
                    author: user,
                    guild: this.guild,
                    fakeChannel: botCommands
                });
            }
        });

        await verifyMessage.react('✅');
    }

    /**
     * Logs out, terminates the connection to Discord, and destroys the client.
     */
    destroy() {
        console.log(`Logging out of ${this.user.tag}`);
        return super.destroy();
    }
}

module.exports = DiscordBot;
