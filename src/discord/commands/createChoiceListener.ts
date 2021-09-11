import { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { toMessageOptions, ReplyResolvable } from "#discord/toMessageOptions";

type ChoiceHandler = () => Promise<ReplyResolvable> | ReplyResolvable;
interface Choice {
  name: string;
  onChoose: ChoiceHandler;
}

export function createChoiceListener(
  interaction: CommandInteraction,
  reply: string | MessageEmbed,
  choices: Array<Choice>,
) {
  choices.sort((a, b) => a.name.localeCompare(b.name));

  const choiceHandlers = new Map<string, ChoiceHandler>();
  const components: Array<MessageActionRow> = [];
  for (let i = 0; i < choices.length; i += 5) {
    const buttons = [];

    for (let j = 0; j < 5 && i + j < choices.length; j++) {
      const choice = choices[i + j];
      buttons.push(new MessageButton().setStyle("PRIMARY").setCustomId(choice.name).setLabel(choice.name));
      choiceHandlers.set(choice.name, choice.onChoose);
    }

    components.push(new MessageActionRow().addComponents(buttons));
  }

  const messageOptions = toMessageOptions(reply);
  messageOptions.components = components;
  interaction.reply(messageOptions);

  const collector = interaction.channel!.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id,
    time: 1000 * 60,
    max: 1,
  });

  collector.on("collect", int => {
    const handler = choiceHandlers.get(int.customId)!;
    const reply = Promise.resolve(handler());

    reply.then(r => interaction.editReply(toMessageOptions(r)));
  });
}
