import { oneLine } from "#shared/stringUtil";

import { Staff } from "#umass/types";
import { getStaffListFromQuery, ScoredStaff } from "#umass/staff";

import { MessageEmbedBuilder } from "#discord/classes/MessageEmbedBuilder";
import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { createChoiceListener } from "../createChoiceListener";
import { CommandError } from "#discord/classes/CommandError";

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
    description: `${staff.title}.${aliases} You can contact them using their email: [${staff.email}](mailto:${staff.email})`,
    fields: [
      ["Phone", staff.phone],
      ["Email", staff.email],
      ["Office", staff.office],
      ["Courses", staff.courses?.join(", ")],
    ]
      .filter(e => Boolean(e[1]))
      .map(entry => {
        return { name: entry[0]!, value: entry[1]! };
      }),
  });
}

export default new SlashCommandBuilder()
  .setName("who-is")
  .setDescription("Displays information about a UMass CICS teaching staff member.")
  .setGroup("Information")
  .setDetails(
    oneLine(`Given a name query, this command will try and find a UMass CICS staff member with a similar
    name. You can find the website that this information is scraped from [here](https://www.cics.umass.edu/people/all-faculty-staff/).`),
  )
  .addExamples(["/who-is person: Mark Corner"])
  .addStringOption(option =>
    option.setName("person").setDescription("The staff member to search for.").setRequired(true),
  )
  .setPattern(/^(who\s*is|who'?s)\s*([a-z ,.'-]+)\??$/i, { person: 2 })
  .setCallback(async interaction => {
    let queryResult: Array<ScoredStaff> | undefined;
    try {
      queryResult = await getStaffListFromQuery(interaction.options.getString("person", true));
    } catch (e) {
      throw new CommandError(
        "I had some trouble connecting to the database. Try again later.",
        "Unable to get staff list from query: " + e,
      );
    }

    if (!queryResult || (queryResult instanceof Array && queryResult.length === 0)) {
      return "I was unable to find staff member with that name.";
    } else if (queryResult.length === 1 || queryResult[0]._score >= 1) {
      return createStaffEmbed(queryResult[0]);
    } else if (queryResult.length > 1) {
      createChoiceListener(
        interaction,
        oneLine(`I was unable to narrow down your search to a single person.
					Which one of the following did you mean?`),
        queryResult.map(x => {
          return {
            name: x.names[0],
            onChoose: () => createStaffEmbed(x),
          };
        }),
      );
    }
  });
