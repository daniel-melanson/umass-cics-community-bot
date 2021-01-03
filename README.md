# UMass CICS Discord Bot

Simple discord bot for the UMass CICS Community server written in TypeScript.

Currently waiting on [#5106](https://github.com/discordjs/discord.js/pull/5106) and [#4879](https://github.com/discordjs/discord.js/pull/4879) to go through before continuing any discord implementation.

## Notable Features
- Commands to display information about CICS related (CS, INFO, MATH, STAT) classes.
- Announce academic calender events such as when the add/drop period ends.
- TeX expression rendering.

## Contributing

### Where do I start?
1. [Fork the repository](https://github.com/daniel-melanson/UMass-CICS-Discord-Bot/fork)
2. Clone your fork: `git clone https://github.com/your-username/UMass-CICS-Discord-Bot.git`
3. Create a branch with your edits: `git checkout -b feature-name`
4. Commit your changes: `git commit -am 'My features description'`
5. Push the changes: `git push origin feature-name`
6. Submit a pull request

### Local Testing
1. Create a new discord server with the given [template](https://discord.new/C8kqqG6RZDrD).
2. [Create and invite a bot to the template server](https://github.com/jagrosh/MusicBot/wiki/Adding-Your-Bot-To-Your-Server).
3. Create a `.env` file in the following format: 
```
DISCORD_OWNER_ID=your-discord-id
DISCORD_GUILD_ID=your-discord-guilds-id
DISCORD_TOKEN=the-token-of-your-bot

MONGO_CONNECTION_STRING=you-will-be-given-this
```
4. Run `npm start`

Keep in mind that database related commands will fail if `MONGO_CONNECTION_STRING` is not defined in your `.env` file. If you would like to contribute you can contact me and I will give you a temporary connection string to the database.

## Credits
This bot uses [discord.js](https://github.com/discordjs/discord.js) to communicate with the discord API.