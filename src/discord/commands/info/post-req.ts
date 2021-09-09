import { Course } from "#umass/types";
import { COURSE_REGEXP_STRING, getCoursePostRequisites, searchCourses, SearchResult } from "#umass/courses";

import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { createChoiceListener } from "../createChoiceListener";

async function makeReply(course: Course) {
  let postReqs;
  try {
    postReqs = await getCoursePostRequisites(course);
  } catch (e) {
    return "I encountered an error while attempting this query. Try again later.";
  }

  if (!postReqs || postReqs.length === 0) {
    return "No courses seem to have this course as an enrollment requirement.";
  } else {
    return `The following courses have ${course.id} listed in their enrollment requirements: \n${postReqs
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(c => `**${c.id}**: ${c.title}`)
      .join("\n")}`;
  }
}

export default new SlashCommandBuilder()
  .setName("post-req")
  .setDescription("Searches for courses that a given course leads into.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/post-req course: CS 187"])
  .addStringOption(option =>
    option.setName("course").setDescription("The root class to find dependents of.").setRequired(true),
  )
  .setPattern(new RegExp(`^what can I take after (${COURSE_REGEXP_STRING})\\??$`, "im"))
  .setCallback(async interaction => {
    let search: SearchResult;
    try {
      search = await searchCourses(interaction.options.getString("course", true));
    } catch (e) {
      return interaction.reply("I encountered an error while attempting this query. Try again later.");
    }

    if (search.error) {
      return interaction.reply(search.error);
    } else if (search.result.length === 1) {
      interaction.reply(await makeReply(search.result[0]));
    } else {
      createChoiceListener(
        interaction,
        `I was unable to narrow down your search to a single course.
        Which one of the following did you mean?`,
        search.result.map(x => {
          return {
            name: x.id,
            onChoose: () => makeReply(x),
          };
        }),
      );
    }
  });
