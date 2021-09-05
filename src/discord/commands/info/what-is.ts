import { MessageEmbedBuilder } from "../../builders/MessageEmbedBuilder";
import { Course } from "../../../umass/types";
import { oneLine, splitCamelCase } from "../../../shared/stringUtil";
import { searchCourses, SearchResult } from "../../../umass/courses";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";
import { toMessageOptions } from "../toMessageOptions";
import { createChoiceListener } from "../createChoiceListener";

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
  .setCallback(async interaction => {
    const options = interaction.options;

    let search: SearchResult;
    try {
      search = await searchCourses(options.getString("course", true));
    } catch (e) {
      console.log("[DATABASE]", e);
      return interaction.reply("I encountered an error while attempting this query. Try again later.");
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
