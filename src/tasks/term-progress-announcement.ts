import { client } from "@/classes/discord-client";
import assert from "assert";
import { fetchCurrentTerms } from "@/umass/spire-api";
import { logger } from "@/utils/logger";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const dayDiff = (d0: Date, d1: Date) =>
  Math.ceil(Math.abs(d0.valueOf() - d1.valueOf()) / MS_PER_DAY);

export async function TermProgressAnnouncement() {
  let terms;

  try {
    terms = await fetchCurrentTerms();
    assert(terms.length <= 2, "Too many terms");
  } catch (e) {
    console.error(e);
    return client.log(`Failed to fetch terms.`);
  }

  if (terms.length === 0) return;

  const termPercents = terms.map((term) => {
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);

    const semesterDays = dayDiff(startDate, endDate);
    const remainingDays = dayDiff(new Date(), endDate);
    return Math.floor(((semesterDays - remainingDays) / semesterDays) * 100);
  });

  const message =
    terms.length == 1
      ? `We are currently **${termPercents[0]}%** through the ${terms[0].id} semester (not including exams).`
      : `We are currently **${termPercents[0]}%** through the ${terms[0].id} semester and **${termPercents[1]}%** through the ${terms[1].id} semester (not including exams).`;

  try {
    await client.announce("general", message);
  } catch (e) {
    logger.error("Failed to announce term progress");
    console.error(e);
  }
}
