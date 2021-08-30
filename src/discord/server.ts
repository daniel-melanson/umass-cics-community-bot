import {
  ApplicationCommandData,
  Client,
  Guild,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";

import { importCommands } from "#discord/commands/index";
import { CONTACT_MESSAGE } from "#discord/constants";
import { BuiltCommand } from "./commands/types";
import { formatEmbed } from "./formatting";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const guildCommands = new Map<string, BuiltCommand>();
async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const command = guildCommands.get(interaction.commandId);
  if (!command) {
    interaction.reply("unexpected error occurred. " + CONTACT_MESSAGE);
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
      .on("ready", async client => {
        try {
          const guild = await client.guilds.fetch(GUILD_ID);
          const globalGuildCommands = await guild.commands.fetch();
          await Promise.all(
            globalGuildCommands.filter(cmd => cmd.applicationId === client.application.id).map(cmd => cmd.delete()),
          );

          const commandBuilders = await importCommands();
          for (const builder of commandBuilders) {
            const appCmd = await guild.commands.create(builder.toJSON() as unknown as ApplicationCommandData);

            guildCommands.set(appCmd.id, {
              embed: formatEmbed({}),
              fn: builder.callback,
            });
          }

          client.on("interactionCreate", interactionCreate);
        } catch (e) {
          rej(e);
        }

        /*
        client.guilds
          .fetch(GUILD_ID)
          .then(guild => guild.commands.fetch())
          .then(commands => Promise.all(commands.map(command => command.delete())))
          .then(() => importCommands())
          .then(commands => {
            const rest = new REST({ version: APIVersion }).setToken(DISCORD_TOKEN);

            return Promise.all([rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
              body: commands.map(cmd => cmd.toJSON()) as RESTPutAPIApplicationGuildCommandsJSONBody,
            }), new Promise(res => res(commands))]);
          })
          .then(result => {
            const [restResult, commands] = result;
            const guildCommandsResult = result as RESTPutAPIApplicationGuildCommandsResult;
            for (const i in guildCommandsResult) {
              const builtCommand = commands[i];

              guildCommands.set(guildCommandsResult[i].id, {
                info: {},
                fn: builtCommand.fn,
                patternListener: builtCommand.patternListener,
              });
            }

            client.on("interactionCreate", interactionCreate);
            res(client);
          });
          .catch(rej);*/
      })
      .login(DISCORD_TOKEN);
  });
}
