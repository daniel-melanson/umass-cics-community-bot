import { CategoryChannel, ColorResolvable } from "discord.js";

import { COURSE_NUMBER_REGEXP, formatCourseIdFromQuery } from "#umass/courses";
import { oneLine } from "#shared/stringUtil";

import { SlashCommandBuilder, CommandPermissionLevel } from "#discord/classes/SlashCommandBuilder";
import { CommandError } from "../../classes/CommandError";

export default new SlashCommandBuilder()
  .setName("add-course")
  .setDescription("Create a role and channel for a course.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setDetails(
    oneLine(
      `This command will create a new channel and role pairing for a given course.
      The channel's name, category, description, position, and permissions will be automatically set.
      The role's name, position, color, and permissions will also be set.
      The permissions of the role will be set to \`0\`, meaning that the role grants no permissions.
      The permissions of the channel will be as follows: The \`everyone\` role will be denied the \`VIEW_CHANNEL\` permission.
      The new course role and \`Snooper\` role will granted \`VIEW_CHANNEL\`.`,
    ),
  )
  .addExamples(["/add-course subject: Computer Science number: 187 title: Programming With Data Structures"])
  .addStringOption(option =>
    option
      .setName("subject")
      .setDescription("The course subject.")
      .addChoices([
        ["Computer Science", "CS"],
        ["College of Information and Computer Sciences", "CICS"],
        ["Informatics", "INFO"],
        ["Mathematics", "MATH"],
        ["Statistics", "STAT"],
      ])
      .setRequired(true),
  )
  .addStringOption(option => option.setName("number").setDescription("The course number (Ex. 187).").setRequired(true))
  .addStringOption(option =>
    option
      .setName("title")
      .setDescription("The course title (Ex. Programming with Data Structures).")
      .setRequired(true),
  )
  .setCallback(async interaction => {
    const options = interaction.options;
    const subject = options.getString("subject", true);
    const number = options.getString("number", true);
    const title = options.getString("title", true);

    const roleName = formatCourseIdFromQuery(subject + " " + number, true);
    if (!roleName) throw new CommandError("That does not seem to be a valid course id.");

    const guild = interaction.guild!;
    const guildRoleManager = guild.roles;
    const guildRoleCollection = await guild.roles.fetch();
    if (guildRoleCollection.find(r => r.name === roleName))
      throw new CommandError(`I was unable to create the role. There is already a role named ${roleName}.`);

    const separator = guildRoleCollection.find(r => r.name === `---- ${subject} ----`);
    if (!separator) throw new CommandError(`I was unable to find the separator role for topic ${subject}.`);

    const positionMap = new Map<number, string>();
    guildRoleCollection.forEach(role => positionMap.set(role.position, role.name));

    let rolePosition;
    for (let i = separator.position - 1; ; i--) {
      const compareRoleName = positionMap.get(i);
      if (!compareRoleName || compareRoleName.startsWith("----") || roleName.localeCompare(compareRoleName) > 0) {
        rolePosition = i + 1;
        break;
      }
    }

    let roleColor: ColorResolvable | undefined;
    if (subject === "CS") {
      switch (number.charAt(0)) {
        case "1":
          roleColor = [241, 196, 15];
          break;
        case "2":
          roleColor = [46, 204, 113];
          break;
        case "3":
        case "4":
          roleColor = [231, 76, 60];
          break;
        case "5":
          roleColor = [26, 188, 156];
          break;
        default:
          roleColor = [155, 89, 182];
          break;
      }
    }

    await interaction.reply("Creating role...");
    let role;
    try {
      role = await guildRoleManager.create({
        name: roleName,
        permissions: [],
        position: rolePosition,
        color: roleColor,
      });
    } catch (e) {
      throw new CommandError(
        "I was unable to create the role. This might be because the bot role is too low on the role list.",
        "Unable to create role: " + e,
      );
    }

    const channels = guild.channels;
    const categoryName = subject === "CS" && Boolean(number.match(/^[5-9]/)) ? "Graduate" : subject;
    const category = channels.cache.find(
      c => c.type === "GUILD_CATEGORY" && !!c.name.match(new RegExp(`\\W${categoryName} classes`, "i")),
    ) as CategoryChannel | undefined;
    if (!category)
      throw new CommandError("I'm sorry, I was unable to find the sorting category. Role created without channel.");

    await interaction.editReply("Creating channel...");

    const categoryChannels = new Array<string>();
    category.children.forEach(child => {
      if (COURSE_NUMBER_REGEXP.test(child.name)) categoryChannels[child.position] = child.name;
    });

    let channelPosition;
    for (let i = categoryChannels.length - 1; i >= 0; i--) {
      const compareChannelName = categoryChannels[i];
      if (!compareChannelName) continue;

      if (!compareChannelName || number.localeCompare(compareChannelName) > 0) {
        channelPosition = i + 1;
        break;
      }
    }

    const snooper = guildRoleCollection.find(r => r.name === "Snooper");
    if (!snooper) throw new CommandError("I was unable to find the Snooper role.");

    let channel;
    try {
      channel = await guild.channels.create(number, {
        type: "GUILD_TEXT",
        parent: category,
        topic: title,
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
      throw new CommandError(
        "I'm sorry, I was unable to create the channel. Make sure that I have the correct permissions.",
        "Unable to create channel: " + e,
      );
    }

    let couldPosition = true;
    try {
      await channel.edit({
        position: channelPosition,
      });
    } catch (e) {
      couldPosition = false;
    }

    interaction.editReply(
      `Created <#${channel.id}> and <@&${role.id}> for ${roleName}: ${title}.` + !couldPosition
        ? "Unable to set role position."
        : "",
    );
  });
