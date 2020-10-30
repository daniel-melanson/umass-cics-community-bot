import data from "UMass/data";
import { getCurrentSemester } from "UMass/calendar";

void data.then(success => {
	if (!success) {
		console.warn(
			`Unable to retrieve complete data from UMass websites. Some features will not work as intended. Cases should be covered.`,
		);
	}

	const semester = getCurrentSemester();
	if (semester) {
		console.log(`${semester.season} ${semester.year}`);
	}
});
