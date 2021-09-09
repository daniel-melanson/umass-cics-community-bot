import { CategoryChannel } from "discord.js";

import { formatCourseIdFromQuery } from "#umass/courses";

import { SlashCommandBuilder, CommandPermissionLevel } from "#discord/classes/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("add-course")
  .setDescription("Create a role and channel for a course.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setDetails("")
  .addExamples(["/add-course id: CS 187 title: Programming With Data Structures"])
  .addStringOption(option => option.setName("id").setDescription("The course id (Ex. CS 187).").setRequired(true))
  .addStringOption(option =>
    option
      .setName("title")
      .setDescription("The course title (Ex. Programming with Data Structures).")
      .setRequired(true),
  )
  .setCallback(async interaction => {
    const options = interaction.options;
    const id = getCourseIdFromQuery(options.getString("id", true));
    const title = options.getString("title", true);
    if (!id) return interaction.reply("That does not seem to be a valid course id.");

    const parts = id.split(" ");
    let subject = parts[0];
    const number = parts[1];

    if (subject === "STATISTIC") subject = "STAT";
    if (subject === "COMPSCI") subject = "CS";

    const guild = interaction.guild!;
    const guildRoleManager = guild.roles;
    const guildRoleCollection = await guild.roles.fetch();
    const separator = guildRoleCollection.find(r => r.name === `---- ${subject} ----`);
    if (!separator) return interaction.reply(`I was unable to find the separator role for topic ${subject}.`);

    const roleName = `${subject} ${number}`;
    if (guildRoleCollection.find(r => r.name === roleName))
      return interaction.reply(`I was unable to create the role. There is already a role named ${id}.`);

    await interaction.reply("Creating role...");
    let role;
    try {
      role = await guildRoleManager.create({
        name: `${subject} ${number}`,
        permissions: [],
        position: separator.position,
      });
    } catch (e) {
      return interaction.reply(
        "I was unable to create the role. This might be because the bot role is too low on the role list.",
      );
    }

    const channels = guild.channels;
    const category = channels.cache.find(
      c => c.type === "GUILD_CATEGORY" && !!c.name.match(new RegExp(`\\W+${subject} classes`, "i")),
    ) as CategoryChannel | undefined;
    if (!category) return interaction.reply("I was unable to find the category. Role created without channel.");

    await interaction.editReply("Creating channel...");
    let channel;
    try {
      channel = await guild.channels.create(number, {
        type: "GUILD_TEXT",
        parent: category,
        topic: title,
      });
    } catch (e) {
      return interaction.reply("I was unable to create the channel. Make sure that I have the correct permissions.");
    }

    const snooper = guildRoleCollection.find(r => r.name === "Snooper");
    if (!snooper) return interaction.reply("I was unable to find the Snooper role.");

    await interaction.editReply("Updating permissions...");
    try {
      await channel.edit({
        lockPermissions: false,
        permissionOverwrites: [
          {
            id: snooper.id,
            type: "role",
            allow: "VIEW_CHANNEL",
          },
          {
            id: guildRoleManager.everyone.id,
            type: "role",
            deny: "VIEW_CHANNEL",
          },
          {
            id: role.id,
            type: "role",
            allow: "VIEW_CHANNEL",
          },
        ],
      });
    } catch (e) {
      return interaction.reply("I was unable to set permissions on the new channel.");
    }

    return interaction.followUp(
      `Created <#${channel.id}> and <@&${role.id}> for ${id}: ${title}. Positioning is not handled.`,
    );
  });
