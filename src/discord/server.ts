import { Client, Intents, Interaction } from "discord.js";
import { RoleCommand } from "#discord/commands/slash/roles/role";
import { Routes, APIVersion, RESTPutAPIApplicationCommandsResult } from "discord-api-types/rest";
import { REST } from "@discordjs/rest";

const guildCommands = new Map<string, unknown>();
async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;
}

export function initialize(): Promise<Client<true>> {
  const DISCORD_TOKEN = process.env["DISCORD_TOKEN"];
  if (!DISCORD_TOKEN) {
    return Promise.reject("Environment variable 'DISCORD_TOKEN' was not defined.");
  }

  const GUILD_ID = process.env["DISCORD_GUILD_ID"];
  if (!GUILD_ID) {
    return Promise.reject("Environment variable 'DISCORD_GUILD_ID' was not defined.");
  }

  return new Promise((res, rej) => {
    new Client({ intents: [Intents.FLAGS.GUILDS] })
      .on("ready", client => {
        const rest = new REST({ version: APIVersion }).setToken(DISCORD_TOKEN);

        rest
          .put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
            body: [RoleCommand],
          })
          .then((response: unknown) => {
            const commandsResult = response as RESTPutAPIApplicationCommandsResult;

            for (const apiCommandResult of commandsResult) {
              guildCommands.set(apiCommandResult.id, {});
            }

            client.on("interactionCreate", interactionCreate);
            res(client);
          }, rej);
      })
      .login(DISCORD_TOKEN)
      .catch(rej);
  });
}
