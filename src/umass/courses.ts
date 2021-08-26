import { FilterOperations } from "mongodb";

import { connectToCollection } from "#umass/database";
import { Course, CourseSubject } from "#umass/types";
import { sanitize } from "#shared/stringUtil";

export const SHORTENED_SUBJECT_REGEXP_STRING =
  "(CS|MATH|STATS|STAT|CICS|INFO|COMPSCI|STATISTIC|INFORMATICS|MATHEMATICS|COMP SCI)";

export const COURSE_REGEXP_STRING = `${SHORTENED_SUBJECT_REGEXP_STRING}?\\s*h?\\d{3}\\w*`;

export function getExactCourseSubject(subject: string): CourseSubject | undefined {
  subject = subject.toUpperCase();
  if (!subject.match(new RegExp(SHORTENED_SUBJECT_REGEXP_STRING))) return undefined;

  switch (subject) {
    case "C":
    case "CS":
    case "COMP SCI":
      subject = "COMPSCI";
      break;
    case "MATHEMATICS":
    case "M":
      subject = "MATH";
      break;
    case "STATS":
    case "STAT":
    case "S":
      subject = "STATISTIC";
      break;
    case "INFORMATICS":
      subject = "INFO";
  }

  return subject as CourseSubject;
}

export function getCourseIdFromQuery(query: string): string | undefined {
  const match = query.trim().match(new RegExp(`^${SHORTENED_SUBJECT_REGEXP_STRING}\\s*(h?\\d{3}\\w*)$`, "im"));

  if (match === null) return undefined;
  return `${getExactCourseSubject(match[1])} ${match[2].toUpperCase()}`;
}

interface SearchResult {
  error?: string;
  result: Array<Course>;
}

export async function searchCourses(query: string): Promise<SearchResult> {
  query = sanitize(query);

  const courseId = getCourseIdFromQuery(query);
  if (courseId) {
    const idMatch = await connectToCollection("courses", async courseCollection => {
      let match = await courseCollection.findOne({
        id: courseId,
      });

      if (!match) {
        match = await courseCollection.findOne({
          id: { $regex: courseId },
        });
      }

      return match;
    });

    if (idMatch) return { result: [idMatch] };
  }

  const aggregateResult = await connectToCollection("courses", async courseCollection =>
    courseCollection
      .aggregate([
        { $match: { $text: { $search: query } } },
        { $addFields: { _score: { $meta: "textScore" } } },
        { $sort: { _score: -1 } },
        { $match: { _score: { $gt: 0.7 } } },
      ])
      .toArray(),
  );

  if (aggregateResult && aggregateResult.length > 0) {
    if (aggregateResult.length > 5) {
      return {
        error: "too many courses found; try narrowing down your search.",
        result: [],
      };
    }

    return {
      result: aggregateResult,
    };
  }

  return {
    error: "no courses match that query.",
    result: [],
  };
}

export function getCoursesFromSubject(subject: CourseSubject, level?: string): Promise<Array<Course>> {
  const query: FilterOperations<Course> = {
    subject: {
      $eq: subject,
    },
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
