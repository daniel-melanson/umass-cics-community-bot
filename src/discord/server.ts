import {
  ApplicationCommandData,
  ApplicationCommandPermissions,
  Client,
  Guild,
  Intents,
  Interaction,
  Message,
  MessageEmbed,
  TextChannel,
} from "discord.js";

import { importCommands } from "./commands/index";
import { CONTACT_MESSAGE } from "./constants";
import { BuiltCommand, CommandPermissionLevel } from "./builders/SlashCommandBuilder";
import { formatEmbed } from "./formatting";
import { log } from "../shared/logger";

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

  const DISCORD_OWNER_ID = process.env["DISCORD_OWNER_ID"];
  if (!DISCORD_OWNER_ID) {
    return Promise.reject("Environment variable 'DISCORD_OWNER_ID' was not defined.");
  }

  return new Promise((res, rej) => {
    client
      .on("ready", async client => {
        log("MAIN", "Logged in as " + client.user.tag);
        log("MAIN", "Initalizing application commands...");

        try {
          const guild = await client.guilds.fetch(GUILD_ID);
          const globalGuildCommands = await guild.commands.fetch();

          log("MAIN", "Deleting leftover commands...");
          await Promise.all(
            globalGuildCommands.filter(cmd => cmd.applicationId === client.application.id).map(cmd => cmd.delete()),
          );
          log("MAIN", "Deleted leftover commands.");

          const commandBuilders = await importCommands();
          const ownerPermission: ApplicationCommandPermissions = {
            id: DISCORD_OWNER_ID,
            type: "USER",
            permission: true,
          };

          const roles = await guild.roles.fetch();
          const createRolePermission = (name: string) => {
            const role = roles.find(r => r.name === name);
            if (!role) throw new Error("Unable to find role " + name);

            return {
              id: role.id,
              type: "ROLE",
              permission: true,
            } as ApplicationCommandPermissions;
          };

          const adminPermission = createRolePermission(CommandPermissionLevel.Administrator);
          const moderatorPermission = createRolePermission(CommandPermissionLevel.Moderator);

          log("MAIN", "Building commands...");
          for (const builder of commandBuilders) {
            const appCmd = await guild.commands.create(builder.toJSON() as unknown as ApplicationCommandData);

            if (builder.permissionLevel !== CommandPermissionLevel.Member) {
              const permissionArray = [ownerPermission];

              switch (builder.permissionLevel) {
                case CommandPermissionLevel.Moderator:
                  permissionArray.push(moderatorPermission);
                // eslint-disable-next-line no-fallthrough
                case CommandPermissionLevel.Administrator:
                  permissionArray.push(adminPermission);
              }

              await appCmd.permissions.add({
                permissions: permissionArray,
              });
            }

            guildCommands.set(appCmd.id, {
              embed: formatEmbed({
                title: `The ${builder.name} command`,
                description: builder.details,
                fields:
                  builder.examples.length > 0
                    ? [
                        {
                          name: "Examples",
                          value: builder.examples.map(e => "`" + e + "`").join(", "),
                        },
                      ]
                    : undefined,
              }),
              fn: builder.callback,
            });

            log("MAIN", "Built command " + builder.name);
          }

          client.on("interactionCreate", interactionCreate);

          log("MAIN", "Application commands initalized. Ready for interaction.");
          res(client);
        } catch (e) {
          rej(e);
        }
      })
      .login(DISCORD_TOKEN);
  });
}
