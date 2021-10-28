import { sanitize } from "#shared/stringUtil";
import { Filter } from "mongodb";

import { connectToCollection } from "./database";
import { Course, CourseSubject } from "./types";

export const SHORTENED_SUBJECT_REGEXP_STRING =
  "(C|CS|COMP SCI|COMPSCI|CICS|S|STATS|STAT|STATISTIC|INFO|INFORMATICS|M|MATHEMATICS|MATH)";

export const COURSE_NUMBER_REGEXP_STRING = "\\d{3}[a-z]*";

export const COURSE_NUMBER_REGEXP = new RegExp(COURSE_NUMBER_REGEXP_STRING);

export const COURSE_REGEXP_STRING = `${SHORTENED_SUBJECT_REGEXP_STRING}?\\s*h?${COURSE_NUMBER_REGEXP_STRING}`;

export function formatCourseIdFromQuery(query: string, shorthandSubject?: boolean): string | undefined {
  const match = query.trim().match(new RegExp(`^${SHORTENED_SUBJECT_REGEXP_STRING}\\s*(h?\\d{3}\\w*)$`, "im"));

  if (match === null) return undefined;

  let subject = match[1].toUpperCase();
  switch (subject) {
    case "C":
    case "CS":
    case "COMP SCI":
    case "COMPSCI":
      subject = shorthandSubject ? "CS" : "COMPSCI";
      break;
    case "MATHEMATICS":
    case "M":
      subject = "MATH";
      break;
    case "STATS":
    case "STAT":
    case "S":
      subject = shorthandSubject ? "STAT" : "STATISTIC";
      break;
    case "INFORMATICS":
      subject = "INFO";
  }

  return `${subject} ${match[2].toUpperCase()}`;
}

export interface SearchResult {
  error?: string;
  result: Array<Course>;
}

export async function searchCourses(query: string): Promise<SearchResult> {
  query = sanitize(query);

  const courseId = formatCourseIdFromQuery(query);
  if (courseId) {
    const [, number] = courseId.split(" ");
    const idMatch = await connectToCollection("courses", async courseCollection => {
      const match = await courseCollection
        .find({
          id: courseId,
        })
        .toArray();

      if (!match || match.length === 0) {
        const found = new Array<Course>();
        const foundNames = new Set<string>();
        const add = async (filter: Filter<Course>) => {
          for (const course of await courseCollection.find(filter).toArray()) {
            if (!foundNames.has(course.id)) {
              foundNames.add(course.id);
              found.push(course);
            }
          }
        };

        await add({
          number: number,
        });

        return found;
      }

      return match;
    });

    if (idMatch && idMatch.length > 0) {
      return { result: idMatch };
    } else {
      query = number;
    }
  }

  const aggregateResult = await connectToCollection("courses", async courseCollection =>
    courseCollection
      .aggregate([
        {
          $search: {
            index: "default",
            text: {
              query: query,
              path: "number",
              fuzzy: {
                maxEdits: 1,
                prefixLength: 1,
              },
            },
          },
        },
      ])
      .toArray(),
  );

  if (aggregateResult && aggregateResult.length > 0) {
    if (aggregateResult.length > 20) {
      return {
        error: "Too many courses found; try narrowing down your search.",
        result: [],
      };
    }

    return {
      result: aggregateResult,
    };
  }

  return {
    error: "No courses match that query.",
    result: [],
  };
}

export function getCoursesFromSubject(subject: CourseSubject, level?: string): Promise<Array<Course>> {
  const query: Filter<Course> = {
    subject: subject,
  };

  if (level) {
    query.number = {
      $regex: new RegExp(`^h?${level}`, "i"),
    };
  }

  return connectToCollection("courses", courseCollection => courseCollection.find(query).toArray());
}

export function getCoursePostRequisites(course: Course): Promise<Array<Course>> {
  return connectToCollection("courses", courseCollection => {
    return courseCollection
      .find({
        enrollmentRequirement: { $regex: new RegExp(course.id, "i") },
      })
      .toArray();
  });
}
