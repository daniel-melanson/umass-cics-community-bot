import { connectToCollection } from "./database";
import { Semester } from "./types";

let semesters: Array<Semester> = [];
export async function fetchSemesters(): Promise<Array<Semester>> {
  semesters = await connectToCollection("semesters", semesterCollection => semesterCollection.find().toArray());

  return semesters;
}

export function getSemesters() {
  return semesters as ReadonlyArray<Semester>;
}

/**
 * Returns the current in session semester based off of today's date.
 * There can only be one semester in session at a time.
 * The result of this method is based upon when classes start and end.
 * Exams times are not considered part of the semester.
 */
export function getInSessionSemester(): Semester | undefined {
  const today = new Date();
  return semesters.find(semester => semester.startDate <= today && semester.endDate >= today);
}

/**
 * Returns an array of semesters in which today's date is in between the first event and last event of the semester.
 * Usually the first and last events of a semester are when classes start and when grades are due, respectively.
 * As an example, by the time grades are due for the fall semester, the winter semester has already started.
 * In such a case, this method will return both the fall semester and the winter semester.
 */
export function getCurrentSemesters(): Array<Semester> {
  const haveEvents: Array<Semester> = [];

  const today = new Date();
  semesters.forEach(semester => {
    const events = semester.events;
    if (events[0].date <= today && events[events.length - 1].date >= today) {
      haveEvents.push(semester);
    }
  });

  return haveEvents.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf());
}
