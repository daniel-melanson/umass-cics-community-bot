import { getCurrentSemesters, getInSessionSemester } from "#umass/calendar";
import { Semester } from "#umass/types";

import { capitalize, oneLine } from "#shared/stringUtil";

import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";
import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { CommandError } from "#discord/classes/CommandError";
import { CommandInteraction } from "discord.js";
import { createChoiceListener } from "../createChoiceListener";

async function trySemesterFetch<T>(func: () => Promise<T>): Promise<T> {
  let semester;
  try {
    semester = await func();
  } catch (e) {
    throw new CommandError(
      "I'm sorry, I had some trouble connecting to the database.",
      "Unable to fetch semester: " + e,
    );
  }

  return semester;
}

function makeSemesterEmbed(semester: Semester) {
  return new MessageEmbedBuilder({
    title: `Academic Calendar for ${capitalize(semester.season)} ${semester.year}`,
    description: semester.events.reduce((prev, current) => {
      return prev + `**${current.date.toLocaleDateString()}**: ${current.description}\n`;
    }, ""),
  });
}

function doSemesterReply(interaction: CommandInteraction, semester: Semester) {
  return interaction.reply({
    embeds: [makeSemesterEmbed(semester)],
  });
}

export default new SlashCommandBuilder()
  .setName("calendar")
  .setDescription("Lists out academic events for the current in-session semester.")
  .setGroup("Information")
  .setDetails(
    oneLine(`On a weekly basis, a child process will scrape the following [webpage](https://www.umass.edu/registrar/calendars/academic-calendar)
    and store academic calender information in a database. This command will query that database and attempt to get the academic calendar of the
    current in-session semester. If there are no in-session semesters, the command will fallback and fetch semesters that have not completed.
    A semester is considered in-session if the current date is between the first and last day of classes. A semester is considered complete
    if there are no events left in the semester. As an example, a semester that is currently in finals week is not in-session and incomplete.`),
  )
  .setCallback(async interaction => {
    const semester = await trySemesterFetch(getInSessionSemester);
    if (!semester) {
      const semesters = await trySemesterFetch(getCurrentSemesters);

      if (semesters.length === 1) return doSemesterReply(interaction, semesters[0]);
      if (semesters.length === 0) throw new Error("Should implement."); // TODO

      createChoiceListener(
        interaction,
        "Which semester would you like to see?",
        semesters.map(semester => {
          const embed = makeSemesterEmbed(semester);
          return {
            name: embed.title!,
            onChoose: () => embed,
          };
        }),
      );
    } else {
      return doSemesterReply(interaction, semester);
    }

    throw new CommandError(
      "It seems that I have no semesters in my database. You can get your information here: https://www.umass.edu/registrar/calendars/academic-calendar",
      "No semesters in DB to fetch.",
    );
  });
