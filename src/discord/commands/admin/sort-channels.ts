import { CategoryChannel, Collection, GuildChannel } from "discord.js";

import { CommandPermissionLevel, SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { CommandError } from "#discord/classes/CommandError";
import { oneLine } from "#shared/stringUtil";
import { COURSE_NUMBER_REGEXP } from "#umass/courses";

function splitFilter<T>(array: Array<T>, test: (t: T) => boolean) {
  const passed = [];
  const failed = [];

  for (const x of array) {
    test(x) ? passed.push(x) : failed.push(x);
  }

  return [passed, failed];
}

const channelSorter = (a: GuildChannel, b: GuildChannel) => a.name.localeCompare(b.name);
async function sortCategory(category: CategoryChannel) {
  const [generalChannels, courseChannels] = splitFilter(
    Array.from(category.children.values()),
    child => !COURSE_NUMBER_REGEXP.test(child.name),
  );

  generalChannels.sort(channelSorter);
  courseChannels.sort(channelSorter);

  const sorted = generalChannels.concat(courseChannels);
  for (let i = 0; i < sorted.length; i++) {
    await sorted[i].edit({
      position: i,
    });
  }
}

export default new SlashCommandBuilder()
  .setName("sort-channels")
  .setDescription("Sorts all the course categories.")
  .setGroup("Administrative")
  .setPermissionLevel(CommandPermissionLevel.Administrator)
  .setDetails(
    oneLine(`Goes through each course channel category and sorts the channels alphabetically.
    Discord does not provide a way to bulk edit channels, positions must be changed individually.
    This causes the command to take around 2 minutes to finish sorting.`),
  )
  .setCallback(async interaction => {
    await interaction.reply("Sorting categories, this may take a few minutes... ");
    const start = Date.now();
    const guild = interaction.guild!;
    const guildChannels = await guild.channels.fetch();

    const categories = guildChannels.filter(
      channel => channel.type === "GUILD_CATEGORY" && /classes$/i.test(channel.name),
    ) as Collection<string, CategoryChannel>;

    for (const [, category] of categories) {
      try {
        await sortCategory(category);
      } catch (e) {
        throw new CommandError(
          `I encountered an error while trying to sort the ${category.name} category.`,
          "Unable to sort category:" + e,
        );
      }
    }

    await interaction.editReply(
      `Sorted all channels in all course categories in ${Math.round((Date.now() - start) / 1000)} seconds.`,
    );
  });
