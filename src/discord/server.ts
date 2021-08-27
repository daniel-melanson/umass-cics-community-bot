import { Client, Guild, Intents, Interaction, Message, MessageEmbed, TextChannel } from "discord.js";
import {
  Routes,
  APIVersion,
  RESTPutAPIApplicationGuildCommandsJSONBody,
  RESTPutAPIApplicationGuildCommandsResult,
} from "discord-api-types/rest";
import { REST } from "@discordjs/rest";

import { SLASH_COMMANDS } from "#discord/commands/slash/index";
import { SlashCommand } from "#discord/commands/types";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const guildCommands = new Map<string, SlashCommand>();
async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const command = guildCommands.get(interaction.commandId);
  if (!command) {
    interaction.reply("unexpected error occurred.");
  } else {
    command.fn(interaction);
  }
}

function findChannel(guild: Guild, name: string) {
  const nameRegExp = new RegExp(`^\\W{0,2}${name}\\W{0,2}$`);
  return guild.channels.cache.find(x => x.type === "GUILD_TEXT" && !!x.name.match(nameRegExp)) as TextChannel;
}

export async function announce(
  name: "general" | "university" | "bot-log" | "bot-commands" | "cics-events",
  message: string | MessageEmbed,
): Promise<Message> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const guild = await client.guilds.fetch(process.env["DISCORD_GUILD_ID"]!);
  const channel = findChannel(guild, name);

  if (channel) {
    return channel.send(message instanceof MessageEmbed ? { embeds: [message] } : message);
  } else {
    throw new Error("Unable to find channel " + name);
  }
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
    client
      .on("ready", client => {
        client.guilds
          .fetch(GUILD_ID)
          .then(guild => guild.commands.fetch())
          .then(commands => Promise.all(commands.map(command => command.delete())))
          .then(() => {
            const rest = new REST({ version: APIVersion }).setToken(DISCORD_TOKEN);

            return rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
              body: SLASH_COMMANDS as RESTPutAPIApplicationGuildCommandsJSONBody,
            });
          })
          .then(result => {
            const commandResult = result as RESTPutAPIApplicationGuildCommandsResult;
            for (const i in commandResult) {
              guildCommands.set(commandResult[i].id, SLASH_COMMANDS[i]);
            }

            client.on("interactionCreate", interactionCreate);
            res(client);
          })
          .catch(rej);
      })
      .login(DISCORD_TOKEN);
  });
}
