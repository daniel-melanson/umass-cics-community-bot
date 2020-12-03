/*
import { getSemesters } from "UMass/db";
import { Season, Semester } from "UMass/types";

export async function getCurrentSemester(): Semester | undefined {
	const semesters

	const now = new Date();
	for (const semester of semesters) {
		if (semester.startDate < now && now < semester.endDate) {
			return semester;
		}
	}

	return undefined;
}

export async function getProceedingSemesterOf(semester: Semester): Semester | undefined {
	let queryYear: number;
	let querySeason: Season;

	if (semester.season === "Fall") {
		querySeason = "Spring";
		queryYear = semester.year + 1;
	} else {
		querySeason = semester.season === "Spring" ? "Summer" : "Fall"
		queryYear = semester.year;
	}

	return semesters.find(s => {
		return s.season === querySeason && s.year === queryYear;
	});
}
*/
