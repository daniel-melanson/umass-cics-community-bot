import fetch from "node-fetch";

import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";
import { CommandError } from "#discord/classes/CommandError";
import { oneLine } from "#shared/stringUtil";

export default new SlashCommandBuilder()
  .setName("tex")
  .setDescription("Render a TeX expression into an image.")
  .setDetails(
    oneLine(`This command will take a given tex expression and pass it to a web api to render it as a PNG.
      Keep in mind that tex expressions and latex are not equivalent. Tex expressions are limited to basic commands
      related to mathematical syntax and symbols. It does not include commands to import packages, use environments,
      read from files, etc...`),
  )
  .addStringOption(option => option.setName("tex").setDescription("The TeX expression to render.").setRequired(true))
  .setPattern(/(?<=\$\$)(.+)(?=\$\$)/, { tex: 1 })
  .setCallback(async interaction => {
    await interaction.reply(`Processing...`);

    let image,
      error = "Unknown";
    try {
      const res = await fetch(`http://www.latex2png.com/api/convert`, {
        method: "POST",
        body: JSON.stringify({
          auth: { user: "guest", password: "guest" },
          latex: interaction.options.getString("tex", true),
          resolution: 600,
          color: "D53131",
        }),
      });
      const json = await res.json();
      if (json.url) image = `http://www.latex2png.com${json.url}`;
      else if (json.error) error = json.error;
    } catch (e) {
      if (e instanceof Error) {
        error = e.message;
      } else {
        throw new CommandError(
          "I'm sorry, I encountered an error while trying to process that.",
          "Unable to convert tex-to-png: " + e,
        );
      }
    }

    if (image) {
      interaction.editReply({
        content: null,
        files: [
          {
            attachment: image,
            name: "tex.png",
          },
        ],
      });
    } else {
      interaction.editReply({
        content: `Unable to convert TeX to png. \`\`\`${error}\`\`\``,
      });
    }
  });
