/*
import { courses } from "UMass/data/db";

export function getCourseIdFromQuery(query: string): string | undefined {
	const match = query
		.trim()
		.toUpperCase()
		.match(/^(cs|math|stat|cics|info|compsci)\s*\d{3}[a-z]*$/i);

	if (match === null) return undefined;

	return `${match[0].replace("CS", "COMPSCI")} ${match[1]}`;
}

export function getCourseDependents(id: string): Array<string> {
	const dependents = [];

	for (const course of courses.values()) {
		if (course.prerequisites !== undefined && course.prerequisites.has(id)) {
			dependents.push(course.id);
		}
	}

	return dependents;
}
*/
