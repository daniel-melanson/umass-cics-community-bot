import { oneLine, splitCamelCase } from "#shared/stringUtil";

import { Course } from "#umass/types";
import { COURSE_REGEXP_STRING, searchCourses, SearchResult } from "#umass/courses";

import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";
import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { toMessageOptions } from "../../toMessageOptions";
import { createChoiceListener } from "../createChoiceListener";
import { CommandError } from "#discord/classes/CommandError";

const ignoredKeys = new Set(["id", "title", "website", "description", "subject", "number"]);

function makeReply(course: Course) {
  const fields = [];

  for (const [key, value] of Object.entries(course)) {
    if (!ignoredKeys.has(key) && value && !key.startsWith("_")) {
      fields.push({
        name: splitCamelCase(key),
        value: value instanceof Array ? value.join(", ") : value,
      });
    }
  }

  return new MessageEmbedBuilder({
    title: `${course.id}: ${course.title}`,
    url: course.website,
    description: course.description,
    fields,
  });
}

export default new SlashCommandBuilder()
  .setName("what-is")
  .setDescription("Responds with information about a UMass CICS related course.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/what-is course: CS 187"])
  .addStringOption(option => option.setName("course").setDescription("The course to search for.").setRequired(true))
  .setPattern(new RegExp(`^(what is|what'?s)\\s*(${COURSE_REGEXP_STRING})\\??$`, "i"), {
    course: 2,
  })
  .setCallback(async interaction => {
    const options = interaction.options;

    let search: SearchResult;
    try {
      search = await searchCourses(options.getString("course", true));
    } catch (e) {
      throw new CommandError(
        "I'm sorry, I had some trouble connecting to the database. Try again later.",
        "Unable to search courses: " + e,
      );
    }

    if (search.error) {
      return interaction.reply(search.error);
    } else if (search.result.length === 1) {
      return interaction.reply(toMessageOptions(makeReply(search.result[0])));
    } else {
      createChoiceListener(
        interaction,
        oneLine(`I was unable to narrow down your search to a single course.
					Which one of the following did you mean?`),
        search.result.map(x => {
          return {
            name: x.id,
            onChoose: () => makeReply(x),
          };
        }),
      );
    }
  });
