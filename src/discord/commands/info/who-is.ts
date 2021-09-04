import { MessageEmbedBuilder } from "../../builders/MessageEmbedBuilder";
import { oneLine } from "../../../shared/stringUtil";
import { getStaffListFromQuery, ScoredStaff } from "../../../umass/staff";
import { Staff } from "../../../umass/types";
import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";
import { replyAndListenForButtonInteraction } from "../actions";

function createStaffEmbed(staff: Staff) {
  const otherNames = staff.names.slice(1);
  const aliases =
    otherNames.length >= 1
      ? ` This staff member also goes by the name${otherNames.length > 1 ? "s" : ""} ${otherNames.join(", ")}.`
      : "";
  return new MessageEmbedBuilder({
    author: {
      name: staff.names[0],
      iconURL: staff.photo,
      url: staff.website,
    },
    description: `${staff.title}.${aliases} You can contact them using their email: ${staff.email}`,
    fields:
      staff.courses.length > 0
        ? [
            {
              name: "Courses",
              value: staff.courses.join(", "),
            },
          ]
        : undefined,
  });
}

export default new SlashCommandBuilder()
  .setName("who-is")
  .setDescription("Displays information about a UMass CICS teaching staff member.")
  .setGroup("Information")
  .setDetails("")
  .addExamples(["/who-is person: Mark Corner"])
  .addStringOption(option =>
    option.setName("person").setDescription("The staff member to search for.").setRequired(true),
  )
  .setCallback(async interaction => {
    let queryResult: Array<ScoredStaff> | undefined;
    try {
      queryResult = await getStaffListFromQuery(interaction.options.getString("person", true));
    } catch (e) {
      console.log("[DATABASE]", e);
    }

    if (!queryResult || (queryResult instanceof Array && queryResult.length === 0)) {
      return interaction.reply({
        content: "I was unable to find staff member with that name.",
        ephemeral: true,
      });
    } else if (queryResult.length === 1 || queryResult[0]._score >= 1) {
      return interaction.reply({
        embeds: [createStaffEmbed(queryResult[0])],
      });
    } else if (queryResult.length > 1) {
      replyAndListenForButtonInteraction(
        interaction,
        oneLine(`I was unable to narrow down your search to a single person.
				Which one of the following did you mean?`),
        queryResult.map(x => x.names[0]),
        int => {
          int.reply({
            embeds: [createStaffEmbed(queryResult!.find(x => x.names[0] === int.customId)!)],
          });
        },
      );
    }
  });
