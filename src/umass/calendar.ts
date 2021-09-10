import { connectToCollection } from "./database";
import { Semester } from "./types";

/**
 * Returns the current in session semester based off of today's date.
 * There can only be one semester in session at a time.
 * The result of this method is based upon when classes start and end.
 * Exams times are not considered part of the semester.
 */
export async function getInSessionSemester(): Promise<Semester | null> {
  const today = new Date();
  return connectToCollection("semesters", semesterCollection =>
    semesterCollection.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today },
    }),
  );
}

/**
 * Returns an array of semesters in which today's date is in between the first event and last event of the semester.
 * Usually the first and last events of a semester are when classes start and when grades are due, respectively.
 * As an example, by the time grades are due for the fall semester, the winter semester has already started.
 * In such a case, this method will return both the fall semester and the winter semester.
 */
export async function getCurrentSemesters(): Promise<Array<Semester>> {
  const haveEvents: Array<Semester> = [];

  await connectToCollection("semesters", async semesterCollection => {
    const semesterCursor = await semesterCollection.find().toArray();
    const today = new Date();
    semesterCursor.forEach(semester => {
      const events = semester.events;
      if (events[0].date <= today && events[events.length - 1].date >= today) {
        haveEvents.push(semester);
      }
    });
  });

  return haveEvents.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf());
}
