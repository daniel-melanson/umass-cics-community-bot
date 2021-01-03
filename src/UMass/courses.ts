import { connectToCollection } from "UMass/database";
import { Course } from "UMass/types";

function getCourseIdFromQuery(query: string): string | undefined {
	const match = query
		.trim()
		.toUpperCase()
		.match(/^(C|CS|M|MATH|STATS|STAT|CICS|INFO|COMPSCI|STATISTIC|INFORMATICS|MATHEMATICS)\s*\d{3}[a-z]*$/i);

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

	return `${subject} ${match[1]}`;
}

export async function getCourseFromQuery(query: string): Promise<Course | Array<Course> | null> {
	query = query.trim();
	query = query.toUpperCase();
	while (query.includes("  ")) query.replaceAll("  ", " ");

	const courseId = getCourseIdFromQuery(query);

	const courseCollection = await connectToCollection("courses");
	if (courseId) {
		return courseCollection.findOne({
			id: courseId,
		});
	} else {
		return courseCollection
			.aggregate([
				{ $match: { $text: { $search: query } } },
				{ $sort: { score: { $meta: "textScore" } } },
				{ $match: { score: { $gt: 1.0 } } },
			])
			.toArray();
	}
}
