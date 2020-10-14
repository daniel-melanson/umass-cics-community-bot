import fetch from "node-fetch";
import cheerio from "cheerio";

type Season = "Spring" | "Summer" | "Fall";
interface Semester {
	season: Season;
	year: "2020" | "2021" | "2022" | "2023" | "2024";
}

interface SemesterCalendar {
	semester: Semester;
	startDate: Date;
	endDate: Date;
}

class Calender {
	async update(): Promise<void> {
		const res = await fetch("https://www.umass.edu/registrar/calendars/academic-calendar");
		const $ = cheerio.load(await res.text());

		for (const header of $(".field-item").children("h3").toArray()) {
			const titleMatch = header?.lastChild?.data?.match(/^(university )?(spring|summer|fall) \d{4}/i);
			if (!titleMatch) continue;

			const sem = {
				season: titleMatch[1],
				year: titleMatch[2],
			};
		}
	}

	getCurrentSemester(): Semester | undefined {
		const now = new Date();

		return {
			season: "Fall",
			year: "2020",
		};
	}
}

export default new Calender();
