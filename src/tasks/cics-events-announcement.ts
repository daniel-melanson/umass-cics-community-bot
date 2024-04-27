import { client } from "@/classes/discord-client";
import { fetchCICSEvents, type CICSEvent } from "@/umass/cics-events";
import colors from "@/utils/colors";
import { EmbedBuilder, type APIEmbed, type APIEmbedField } from "discord.js";

function makeEventEmbed(event: CICSEvent): APIEmbed {
  const fields: APIEmbedField[] = [];
  function addField(name: string, value: string, inline = false) {
    fields.push({ name, value, inline });
  }

  if (event.speaker) addField("Speaker", event.speaker);
  if (event.time) addField("Time", event.time);
  if (event.location) addField("Location", event.location);

  const embed = new EmbedBuilder()
    .setTitle(event.title)
    .setURL(event.href)
    .setColor(colors.MAROON)
    .setDescription(event.body)
    .addFields(fields);

  return embed.toJSON();
}

export async function CICSEventsAnnouncement() {
  let events;
  try {
    events = await fetchCICSEvents();
  } catch (e) {
    return client.log(`Failed to fetch CICS events.`);
  }

  if (events.length === 0) return;

  const embeds = events.map(makeEventEmbed);

  await client.announce("cics-events-🎫", { embeds });
}
