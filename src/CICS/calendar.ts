import fetch from "node-fetch";
import cheerio from "cheerio";

type Season = "Spring" | "Summer" | "Fall";
type Year = "2020" | "2021" | "2022" | "2023" | "2024";
interface SignificantDate {
	date: Date;
	description: string;
}

interface Semester {
	season: Season;
	year: Year;
	startDate: Date;
	endDate: Date;
	significantDates: Array<SignificantDate>;
}

class Calender {
	private semesters: Array<Semester> = [];

	async update(): Promise<void> {
		const res = await fetch("https://www.umass.edu/registrar/calendars/academic-calendar");
		const $ = cheerio.load(await res.text());

		const updated = [];
		for (const semesterHeader of $(".field-item h3").toArray()) {
			const titleMatch = semesterHeader?.lastChild?.data
				?.trim()
				.match(/^(university )?(spring|summer|fall) (\d{4})/i);
			if (!titleMatch) continue;

			const season = titleMatch[2];
			const year = titleMatch[3];

			const semesterDates = semesterHeader.nextSibling.nextSibling.firstChild.children.map(x => {
				const children = x.children.filter(x => x.type === "tag").map(x => x.firstChild.data?.trim() || "");
				return {
					date: new Date(`${children[2]} ${children[3]}, ${year}`),
					description: children[0].trim(),
				};
			});

			const startDate = semesterDates.find(x => !!x.description.match(/^(first day of classes)/i));
			if (!startDate) throw new Error(`Unable to find start date for semester ${season} ${year}.`);

			const endDate = semesterDates.find(x => !!x.description.match(/^(last day of classes)/i));
			if (!endDate) throw new Error(`Unable to find end date for semester ${season} ${year}.`);

			updated.push({
				season: season as Season,
				year: year as Year,
				startDate: startDate.date,
				endDate: endDate.date,
				significantDates: semesterDates,
			});
		}

		this.semesters = updated;
	}

	getCurrentSemester(): Semester | undefined {
		const now = new Date();

		for (const semester of this.semesters) {
			if (semester.startDate < now && now < semester.endDate) {
				return semester;
			}
		}

		return undefined;
	}
}

export default new Calender();
