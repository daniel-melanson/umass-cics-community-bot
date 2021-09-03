import { MessageEmbedBuilder } from "discord/builders/MessageEmbedBuilder";
import { getInSessionSemester } from "../../../umass/calendar";
import { capitalize } from "../../../shared/stringUtil";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("calendar")
  .setDescription("Lists out academic events for the current in-session semester.")
  .setGroup("Information")
  .setDetails("")
  .setCallback(async interaction => {
    let semester;
    try {
      semester = await getInSessionSemester();
    } catch (e) {
      return interaction.reply("I had some trouble while trying to connect to the database.");
    }

    if (!semester) return interaction.reply("we are currently not in session.");

    return interaction.reply({
      embeds: [
        new MessageEmbedBuilder({
          title: `Academic Calendar for ${capitalize(semester.season)} ${semester.year}`,
          description: semester.events.reduce((prev, current) => {
            return prev + `**${current.date.toLocaleDateString()}**: ${current.description}\n`;
          }, ""),
        }),
      ],
    });
  });
