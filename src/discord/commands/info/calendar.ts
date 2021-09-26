import { getCurrentSemesters, getInSessionSemester, getSemesters } from "#umass/calendar";
import { Semester } from "#umass/types";

import { capitalize, oneLine } from "#shared/stringUtil";

import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";
import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { CommandError } from "#discord/classes/CommandError";
import { createChoiceListener } from "../createChoiceListener";
import { CommandInteraction } from "discord.js";

function makeSemesterEmbed(semester: Semester) {
  return new MessageEmbedBuilder({
    title: `Academic Calendar for ${capitalize(semester.season)} ${semester.year}`,
    description: semester.events.reduce((prev, current) => {
      return prev + `**${current.date.toLocaleDateString()}**: ${current.description}\n`;
    }, ""),
  });
}

function createSemesterChoiceListener(interaction: CommandInteraction, semesters: ReadonlyArray<Semester>) {
  createChoiceListener(
    interaction,
    "Which semester would you like to see?",
    semesters.map(semester => {
      const embed = makeSemesterEmbed(semester);
      return {
        name: `${capitalize(semester.season)} ${semester.year}`,
        onChoose: () => embed,
      };
    }),
  );
}

export default new SlashCommandBuilder()
  .setName("calendar")
  .setDescription("Lists out academic events for the current in-session semester.")
  .setGroup("Information")
  .setDetails(
    oneLine(`This command replies with an embed listing out all the dates of a semester.
    When \`select\` is true, the user will be able to choose from any available semester.
    Otherwise, this command will attempt to determine the most suitable semester to display.
    If the there is a current semester in session, that semester will be displayed.
    If we are between two semesters (e.i Winter session starts before Fall grades are due),
    then the user will be able to choose between the two.`),
  )
  .addBooleanOption(option =>
    option.setName("select").setDescription("Manually select which calendar to see.").setRequired(false),
  )
  .setCallback(async interaction => {
    if (interaction.options.getBoolean("select")) {
      return createSemesterChoiceListener(interaction, getSemesters());
    }

    const semester = getInSessionSemester();
    if (semester) {
      return makeSemesterEmbed(semester);
    }

    const currentSemesters = getCurrentSemesters();
    if (currentSemesters.length === 1) return makeSemesterEmbed(currentSemesters[0]);
    if (currentSemesters.length === 0) {
      const now = Date.now();
      const semesters = getSemesters().filter(sem => sem.startDate.valueOf() > now);
      if (semesters.length === 0)
        throw new CommandError(
          oneLine(`I'm sorry. It seems that I do not have the next semester in my database. You can find calender information here: 
              https://www.umass.edu/registrar/calendars/academic-calendar`),
        );

      let closest = semesters[0];
      let closestDiff = closest.startDate.valueOf() - now;
      for (let i = 1; i < semesters.length; i++) {
        const diff = semesters[i].startDate.valueOf() - now;
        if (diff < closestDiff) {
          closest = semesters[i];
          closestDiff = diff;
        }
      }

      return makeSemesterEmbed(closest);
    } else {
      return createSemesterChoiceListener(interaction, currentSemesters);
    }
  });
