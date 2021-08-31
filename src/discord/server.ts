import {
  ApplicationCommand,
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
import { log, warn } from "../shared/logger";
import { isAssignable } from "./roles";
import { CommandError } from "./commands/CommandError";

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const guildCommands = new Map<string, BuiltCommand>();
async function interactionCreate(interaction: Interaction) {
  if (!interaction.isCommand()) return;

  const command = guildCommands.get(interaction.commandId);
  if (!command) {
    interaction.reply("unexpected error occurred. No command found." + CONTACT_MESSAGE);
  } else {
    try {
      await command.fn(interaction);
    } catch (e) {
      if (e instanceof CommandError) {
        interaction.reply(e.message);
      } else {
        warn("COMMAND", "Uncaught error.", e);
      }
    }
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
        log("MAIN", `Logged in as ${client.user.tag}.`);
        log("MAIN", "Initalizing application commands...");

        try {
          log("MAIN", "Building commands...");
          const guild = await client.guilds.fetch(GUILD_ID);

          if (process.env["DISCORD_CLEAR_PERMISSIONS"]) {
            const guildRoleCollection = await guild.roles.fetch();
            for (const role of guildRoleCollection.values()) {
              if (isAssignable(role.name)) {
                await role.setPermissions(0n);
              }
            }
          }

          const commandBuilderMap = await importCommands();

          const commandBuilderArray = Array.from(commandBuilderMap.values());
          const applicationCommandCollection = await guild.commands.set(
            commandBuilderArray.map(builder => builder.toJSON() as unknown as ApplicationCommandData),
          );
          log("MAIN", `Built ${applicationCommandCollection.size} commands.`);

          log("MAIN", `Setting up permissions...`);
          const applicationCommandMap = new Map<string, ApplicationCommand>();
          for (const appCmd of applicationCommandCollection.values()) {
            applicationCommandMap.set(appCmd.name, appCmd);
          }

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

          for (const builder of commandBuilderMap.values()) {
            const appCmd = applicationCommandMap.get(builder.name)!;

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
          }
          log("MAIN", `Permissions set up.`);

          client.on("interactionCreate", interactionCreate);

          log("MAIN", "Application commands initialized. Ready for interaction.");
          res(client);
        } catch (e) {
          rej(e);
        }
      })
      .login(DISCORD_TOKEN);
  });
}
