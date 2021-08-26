import fetch from "node-fetch";
import cheerio from "cheerio";

interface CICSEvent {
  title: string;
  type: string;
  time?: string;
  speaker?: string;
  body: string;
  link: string;
}

async function fetchAndLoad(url: string) {
  const res = await fetch(url);
  return cheerio.load(await res.text());
}

export async function getCICSEvents(): Promise<Array<CICSEvent>> {
  const today = new Date().toISOString();
  const isoString = today.substring(0, today.indexOf("T"));
  let $ = await fetchAndLoad("https://www.cics.umass.edu/events/" + isoString);

  const events = $("div.view-event-wrapper")
    .toArray()
    .reduce((cicsEvents, eventElement) => {
      const eventObject = $("> div", eventElement)
        .toArray()
        .reduce((event, attributeElement) => {
          const classAttrib = attributeElement.attribs["class"];
          const attribMatch = classAttrib.match(/views-field(-field)?-([\w-]+)/);
          if (!attribMatch) {
            console.warn("[UMASS-EVENTS] Unknown class: " + classAttrib);
          } else {
            const attribType = attribMatch[2];
            if (attribType === "title") {
              const link = $("a", attributeElement);
              if (link) {
                let href = link.attr()["href"];
                if (href.startsWith("/")) {
                  href = "https://www.cics.umass.edu" + href;
                }

                event.link = href;
              }
            }

            const text = $(attributeElement).text().trim().replaceAll(/\s\s/g, " ");
            if (attribType === "title") {
              event[attribType] = text;
            } else if (attribType === "speaker-link") {
              const speakerMatch = text.match(/(Speaker: )? (.+)/);
              if (speakerMatch) event.speaker = speakerMatch[2];
            } else if (attribType === "date-1") {
              const timeMatch = text.match(/\w+, [\d/]+ (.+)/);
              if (timeMatch) event.time = timeMatch[1];
            } else if (attribType === "event-type") {
              event.type = text;
            }
          }

          return event;
        }, {} as CICSEvent);

      if (eventObject.type !== "Academic Calendar") {
        cicsEvents.push(eventObject);
      }

      return cicsEvents;
    }, [] as Array<CICSEvent>);

  for (const event of events) {
    $ = await fetchAndLoad(event.link);

    const summary = $("div.field-type-text-with-summary > :first-child > :first-child > p")
      .toArray()
      .map(elem => $(elem).text().trim().replaceAll(/\s\s/g, " "))
      .join("\n");

    event.body = summary.substring(0, 250);

    if (event.body.length === 250) {
      event.body += "...";
    }
  }

  return events;
}
