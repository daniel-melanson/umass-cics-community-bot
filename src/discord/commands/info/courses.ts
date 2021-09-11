import { CourseSubject } from "#umass/types";
import { getCoursesFromSubject } from "#umass/courses";

import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";
import { CommandError } from "#discord/classes/CommandError";
import { oneLine } from "#shared/stringUtil";

function divideLines(lines: Array<string>) {
  const groups = [];

  let curr = "";
  for (const line of lines) {
    const join = curr + line + "\n";
    if (join.length < 2000) {
      curr = join;
    } else {
      groups.push(join);
      curr = "";
    }
  }

  return groups;
}

export default new SlashCommandBuilder()
  .setName("courses")
  .setDescription("Generates a list of courses given a subject.")
  .setGroup("Information")
  .setDetails(
    oneLine(`This command will fetch all course in a database given a course subject.
    Optionally, you can filter the courses by level by providing a \`level\` argument.
    In that situation, the courses will be listed out by title instead of id.`),
  )
  .addExamples(["/courses subject: Statistics level: 100 Level"])
  .addStringOption(option =>
    option
      .setName("subject")
      .setDescription("The subject of the course.")
      .addChoices([
        ["Computer Science", "COMPSCI"],
        ["College of Information and Computer Science", "CICS"],
        ["Mathematics", "MATH"],
        ["Statistics", "STATISTIC"],
      ])
      .setRequired(true),
  )
  .addStringOption(option =>
    option
      .setName("level")
      .setDescription("The level of the course.")
      .addChoices([
        ["100 Level", "1"],
        ["200 Level", "2"],
        ["300 Level", "3"],
        ["400 Level", "4"],
        ["500 Level", "5"],
        ["600 Level", "6"],
        ["700 Level", "7"],
        ["800 Level", "8"],
      ]),
  )
  .setCallback(async interaction => {
    const options = interaction.options;
    const subject = options.getString("subject", true);
    const level = options.getString("level") || undefined;

    let courses;
    try {
      courses = await getCoursesFromSubject(subject as CourseSubject, level);
    } catch (e) {
      throw new CommandError(
        "I'm sorry, I had some trouble connecting to the database. Try again later.",
        "Unable to get courses from subject: " + e,
      );
    }

    if (level) {
      const messages = divideLines(
        [`UMass ${subject} ${level}00 Level Courses\n\n`].concat(
          courses.sort((a, b) => a.id.localeCompare(b.id)).map(course => `**${course.id}**: ${course.title}`),
        ),
      );

      const channel = interaction.channel!;
      for (const message in messages) {
        await channel.send(message);
      }
    } else {
      const fields = [];
      const idList = courses.map(course => course.id.substring(subject.length + 1)).sort((a, b) => b.localeCompare(a));

      const groupRegexList = ["1", "2", "3", "4", "5", "[6-9]"];
      for (const regexStr of groupRegexList) {
        const filtered = [];
        const groupExp = new RegExp(regexStr);
        while (idList.length > 0 && idList[idList.length - 1].match(groupExp)) {
          filtered.push(idList.pop()!);
        }

        if (filtered.length > 0) {
          fields.push({
            name: regexStr.length === 1 ? regexStr + "00 Level" : "600+ Level",
            value: filtered.join(", "),
          });
        }
      }

      if (idList.length > 0) {
        fields.push({
          name: "Honors Colloquium",
          value: idList.join(", "),
        });
      }

      return interaction.reply({
        embeds: [
          new MessageEmbedBuilder({
            title: `UMass ${subject} Courses`,
            fields: fields,
          }),
        ],
      });
    }
  });
