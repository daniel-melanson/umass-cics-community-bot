import { connectToCollection } from "UMass/database";
import { Course, CourseSubject } from "UMass/types";
import { sanitize } from "Shared/stringUtil";

export const SHORTENED_SUBJECT_REGEXP_STRING =
	"(CS|MATH|STATS|STAT|CICS|INFO|COMPSCI|STATISTIC|INFORMATICS|MATHEMATICS|COMP SCI)";

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
	const match = query.trim().match(new RegExp(`^${SHORTENED_SUBJECT_REGEXP_STRING}\\s*(h?\\d{3}[a-z0-9]*)$`, "im"));

	if (match === null) return undefined;
	return `${getExactCourseSubject(match[1])} ${match[2]}`;
}

export async function getCourseFromQuery(query: string): Promise<Course | Array<Course> | null> {
	query = sanitize(query);

	const courseId = getCourseIdFromQuery(query);

	const courseCollection = await connectToCollection("courses");
	if (courseId) {
		return courseCollection.findOne({
			id: courseId,
		});
	} else {
		return courseCollection
			.aggregate([{ $match: { $text: { $search: query } } }, { $sort: { score: { $meta: "textScore" } } }])
			.toArray();
	}
}

export async function getCoursesFromSubject(subject: CourseSubject): Promise<Array<Course>> {
	const courseCollection = await connectToCollection("courses");

	return courseCollection
		.find({
			subject: subject,
		})
		.toArray();
}
