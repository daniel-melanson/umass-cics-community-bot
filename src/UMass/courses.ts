import { connectToCollection } from "UMass/database";
import { Course } from "UMass/types";
import { sanitize } from "Shared/stringUtil";

function getCourseIdFromQuery(query: string): string | undefined {
	const match = query
		.trim()
		.toUpperCase()
		.match(/^(C|CS|M|MATH|STATS|STAT|CICS|INFO|COMPSCI|STATISTIC|INFORMATICS|MATHEMATICS)\s*(h?\d{3}[a-z0-9]*)$/im);

	if (match === null) return undefined;

	let subject = match[1];
	switch (match[1]) {
		case "C":
		case "CS":
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

	return `${subject} ${match[2]}`;
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
