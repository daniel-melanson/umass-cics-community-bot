# UMass CICS Discord Bot

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

DEBUG=true
```
4. Run `npm start`

In debug mode, all database related queries will fail. This is by design, as it would be a pain to set up a local database for anyone wanting to contribute. Given that the amount of people contributing to this project is very small, I did not feel that it was worth the effort to setup something with docker. Even if I did, the people looking at this project are usually new to computer science and probably have difficulty. If you have an idea for a feature that would use the database, make an issue and I'll get around to it.

## Credits
This bot uses [discord.js](https://github.com/discordjs/discord.js) to communicate with the discord API.