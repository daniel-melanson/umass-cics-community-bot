import { client } from "@/classes/discord-client";
import { DiscordEmbedBuilder } from "@/classes/discord-embed-builder";
import { fetchCICSEvents, type CICSEvent } from "@/umass/cics-events";
import { EmbedBuilder, type APIEmbed, type APIEmbedField } from "discord.js";

function makeEventEmbed(event: CICSEvent): APIEmbed {
  const fields: APIEmbedField[] = [];
  function addField(name: string, value: string, inline = false) {
    fields.push({ name, value, inline });
  }

  if (event.speaker) addField("Speaker", event.speaker);
  if (event.time) addField("Time", event.time);
  if (event.location) addField("Location", event.location);

  const embed = new DiscordEmbedBuilder()
    .setTitle(event.title)
    .setURL(event.href)
    .setDescription(event.body)
    .addFields(fields);

  return embed.toJSON();
}

export async function CICSEventsAnnouncement() {
  let events;
  try {
    events = await fetchCICSEvents();
  } catch (e) {
    console.error(e);
    return client.error(`Failed to fetch CICS events.`);
  }

  if (events.length === 0) return;

  const embeds = events.map(makeEventEmbed);

  try {
    await client.announce("cics-events", { embeds });
  } catch (e) {
    console.error(e);
    return client.error(`Failed to announce CICS events.`);
  }
}
