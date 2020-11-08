import { courseMap } from "UMass/data";

export function getCourseIdFromQuery(query: string): string | undefined {
	const match = query
		.trim()
		.toUpperCase()
		.match(/^(cs|math|stat|cics|info|compsci)\s*\d{3}[a-z]*$/i);

	if (match === null) return undefined;

	return `${match[0].replace("CS", "COMPSCI")} ${match[1]}`;
}

export function getCourseDependents(id: string): Array<string> {
	if (courseMap === undefined) throw new Error("Unable to get UMass data");

	const dependents = [];

	for (const course of courseMap.values()) {
		if (course.prerequisites !== undefined && course.prerequisites.has(id)) {
			dependents.push(course.id);
		}
	}

	return dependents;
}
