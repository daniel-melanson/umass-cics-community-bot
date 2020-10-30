interface SignificantDate {
	date: Date;
	description: string;
}

export type Season = "Spring" | "Summer" | "Fall";

export interface Semester {
	season: Season;
	year: string;
	startDate: Date;
	endDate: Date;
	significantDates: Array<SignificantDate>;
}

interface PreviousSemester {
	season: Season;
	year: string;
}

export interface Course {
	id: string;
	title: string;
	description: string;
	credits: string;
	mostRecentSemester: string;
	frequency: string;
	staff: Array<string>;
	prerequisites?: Map<string, boolean>;
}
