# UMass CICS Discord Bot

## Contributing


## Development
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
```
4. Run `npm start`

## Credits
This bot uses [discord.js](https://github.com/discordjs/discord.js) to communicate with the discord API. From 