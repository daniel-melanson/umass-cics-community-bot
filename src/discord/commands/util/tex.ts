import fetch from "node-fetch";

import { SlashCommandBuilder } from "#discord/classes/SlashCommandBuilder";

export default new SlashCommandBuilder()
  .setName("tex")
  .setDescription("Render a TeX expression into an image.")
  .addStringOption(option => option.setName("tex").setDescription("The TeX expression to render.").setRequired(true))
  .setCallback(async interaction => {
    await interaction.reply(`processing...`);

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
      }
    }

    if (image) {
      return interaction.editReply({
        content: "Expression rendered:",
        files: [
          {
            attachment: image,
            name: "tex.png",
          },
        ],
      });
    } else {
      return interaction.editReply({
        content: `Unable to convert TeX to png. \`\`\`${error}\`\`\``,
      });
    }
  });
