import { Semester } from "UMass/types";
import { semesters } from "UMass/data";

export function getCurrentSemester(): Semester | undefined {
	if (semesters === undefined) {
		throw new Error("No semester data under UMass/data");
	}

	const now = new Date();

	for (const semester of semesters) {
		if (semester.startDate < now && now < semester.endDate) {
			return semester;
		}
	}

	return undefined;
}
