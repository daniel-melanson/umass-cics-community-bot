import * as cheerio from "cheerio";
import url from "url";
import assert from "assert";
import { match } from "ts-pattern";
import { logger } from "@/utils/logger";

export interface CICSEvent {
  title: string;
  type: string;
  time?: string;
  speaker?: string;
  location?: string;
  body: string;
  href: string;
}

interface EventInfo {
  key: keyof CICSEvent;
  value: string;
}

const BASE_URL = "https://www.cics.umass.edu";
async function fetchAndLoad(url: string) {
  const response = await fetch(url);
  return cheerio.load(await response.text());
}

async function fetchEventBody(href: string): Promise<string> {
  const $ = await fetchAndLoad(href);
  const paragraphs = $(
    "div.field-type-text-with-summary > :first-child > :first-child > p",
  );

  assert(paragraphs, "Failed to find event body paragraph");

  return paragraphs
    .map((_, p) => $(p).text().trim())
    .toArray()
    .join("\n\n");
}

export async function fetchCICSEvents(): Promise<CICSEvent[]> {
  return [];
//   const date = new Date().toISOString().split("T")[0];
//   logger.info(`Fetching CICS events for ${date}`);
//   const $ = await fetchAndLoad(url.resolve(BASE_URL, `/events/${date}`));
//
//   const text = (e: cheerio.Cheerio) => $(e).text().trim();
//
//   function extractInfo(
//     field: cheerio.Element,
//     type: string,
//   ): EventInfo | undefined {
//     return match(type)
//       .with("title", () => ({ key: "title", value: text(field) }))
//       .with("field-event-type", () => ({
//         key: "type",
//         value: text(field),
//       }))
//       .with("field-date-1", () => {
//         const value = text(field);
//
//         const match = value.match(/\w+, \d{2}\/\d{2}\/\d{4} (.+)/);
//
//         return match ? { key: "time", value: match[1] } : undefined;
//       })
//       .with("field-speaker-link", () => {
//         const prefix = "Speaker: ";
//         const value = text(field);
//
//         return {
//           key: "speaker",
//           value: value.startsWith(prefix)
//             ? value.substring(prefix.length)
//             : value,
//         };
//       })
//       .with("field-address", () => ({
//         key: "location",
//         value: text(field),
//       }))
//       .with("body", () => ({ key: "body", value: text(field) }))
//       .with("body-1", () => {
//         const anchor = $("a", field).get(0);
//         assert(anchor, "Unable to find read more anchor");
//
//         const href = anchor.attribs["href"];
//         assert(
//           href && href.length > 0 && href.startsWith("/event"),
//           "Invalid href",
//         );
//
//         return { key: "href", value: url.resolve(BASE_URL, href) };
//       })
//       .otherwise(() => undefined) as EventInfo | undefined;
//   }
//
//   const events = $("div.view-event-wrapper")
//     .map((_, eventWrapper) => {
//       const eventFields = $("div.views-field", eventWrapper)
//         .map((_, field) => {
//           const classes = field.attribs["class"].split(" ");
//           assert(classes.length == 2, "Expected 2 classes on event field");
//
//           const typeMatch = classes[1].match(/views-field-([\w-]+)/);
//           assert(typeMatch, "Failed to match event field class");
//
//           const type = typeMatch[1];
//           return extractInfo(field, type);
//         })
//         .toArray();
//
//       const event = eventFields.reduce((acc, info) => {
//         if (!info) return acc;
//
//         const { key, value } = info;
//         acc[key] = value;
//         return acc;
//       }, {} as Partial<CICSEvent>);
//
//       logger.trace("Raw event: %o", event);
//       assert(
//         event.title && event.type && event.href,
//         `Event ${event.title} is missing required fields`,
//       );
//
//       return event as CICSEvent;
//     })
//     .toArray();
//
//   for (const event of events) {
//     event.body = await fetchEventBody(event.href);
//     logger.trace("Fetched event: %o", event);
//   }
//
//   return events;
}
