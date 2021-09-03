import { CommandInteraction, MessageActionRow, MessageButton, MessageComponentInteraction } from "discord.js";

export function replyAndListenForButtonInteraction(
  interaction: CommandInteraction,
  reply: string,
  options: Array<string>,
  handler: (interaction: MessageComponentInteraction) => void | Promise<void>,
) {
  options.sort();

  const components: Array<MessageActionRow> = [];
  for (let i = 0; i < options.length; i += 5) {
    const buttons = [];

    for (let j = 0; j < 5 && i + j < options.length; j++) {
      const option = options[i + j];
      buttons.push(new MessageButton().setStyle("PRIMARY").setCustomId(option).setLabel(option));
    }
    components.push(new MessageActionRow().addComponents(buttons));
  }

  interaction.reply({
    content: reply,
    components,
  });

  const set = new Set();
  const collector = interaction.channel!.createMessageComponentCollector({
    filter: i => !set.has(i.customId),
    time: 1000 * 60,
  });

  collector.on("collect", int => {
    const customId = int.customId;
    set.add(customId);

    interaction.editReply({
      components: components.map(row =>
        new MessageActionRow().addComponents(
          row.components.map(btn => (btn.customId == customId ? btn.setDisabled(true) : btn)),
        ),
      ),
    });

    handler(int);
  });

  collector.on("end", () => {
    interaction.editReply({
      components: components.map(row =>
        new MessageActionRow().addComponents(row.components.map(btn => btn.setDisabled(true))),
      ),
    });
  });
}
