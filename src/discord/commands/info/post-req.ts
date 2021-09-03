import { CommandInteraction, MessageComponentInteraction } from "discord.js";
import { Course } from "umass/types";
import { oneLine } from "../../../shared/stringUtil";
import { getCoursePostRequisites, searchCourses, SearchResult } from "../../../umass/courses";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";
import { replyAndListenForButtonInteraction } from "../actions";

async function doSearchAndReply(interaction: CommandInteraction | MessageComponentInteraction, course: Course) {
  let postReqs;
  try {
    postReqs = await getCoursePostRequisites(course);
  } catch (e) {
    return interaction.reply("I encountered an error while attempting this query. Try again later.");
  }

  if (!postReqs || postReqs.length === 0) {
    return interaction.reply("no courses seem to have this course as an enrollment requirement.");
  } else {
    return interaction.reply(
      `The following courses have ${course.id} listed in their enrollment requirements: \n${postReqs
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(c => `**${c.id}**: ${c.title}`)
        .join("\n")}`,
    );
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
      doSearchAndReply(interaction, search.result[0]);
    } else {
      replyAndListenForButtonInteraction(
        interaction,
        oneLine(`I was unable to narrow down your search to a single course.
					Which one of the following did you mean?`),
        search.result.map(x => x.id),
        int => doSearchAndReply(int, search.result.find(c => c.id === int.customId)!),
      );
    }
  });
