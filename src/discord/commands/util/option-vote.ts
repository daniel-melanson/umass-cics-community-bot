import { SlashCommandBuilder } from "../../builders/SlashCommandBuilder";

let optionVoteBuilder = new SlashCommandBuilder()
  .setName("option-vote")
  .setDescription("Create a multiple choice poll in the current channel.")
  .addStringOption(option =>
    option.setName("question").setDescription("The question you would like to pose.").setRequired(true),
  );

const REACTION_EMOJIS = ["🇦", "🇧", "🇨", "🇩", "🇪", "🇫"];
const REACTION_EMOJI_LETTERS = ["A", "B", "C", "D", "E", "F"];

for (const [i, letter] of REACTION_EMOJI_LETTERS.entries()) {
  optionVoteBuilder = optionVoteBuilder.addStringOption(option =>
    option
      .setName("choice-" + letter.toLowerCase())
      .setDescription(`The ${letter} choice.`)
      .setRequired(i < 3),
  );
}

export default optionVoteBuilder.setCallback(interaction => interaction.reply("Not implemented"));
