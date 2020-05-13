# UMass CICS Discord Bot

## Contributing

### Issues
If you have a feature request, were explicitly told by the bot that you encountered a fatal error, or might have found a bug, please make a [new issue](https://github.com/daniel-melanson/UMass-CICS-Discord-Bot/issues).

When submitting a bug report:
- A command sample to reproduce the issue or specfic steps to follow
- What the expected behavior was
- What actually happened

When submitting a request:
- What this request would do
- Give a scenario where this could be used
- How would this benefit the community
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
3. Create a `src/config.json` file in the following format: 
```json
{
  "owner": "your-discord-user-id",
  "token": "the-token-of-your-discord-bot"
}
```
4. Run `npm start`

### Quality and Formatting

## Credits
This bot uses [discord.js](https://github.com/discordjs/discord.js) to communicate with the discord API. From 