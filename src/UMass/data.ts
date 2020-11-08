// I hate writing scraping logic.

import fetch from "node-fetch";
import cheerio from "cheerio";
import cron from "node-cron";

import { Semester, Course, Season } from "UMass/types";

export let semesters: Array<Semester> | undefined;
export let courseMap: Map<string, Course> | undefined;

async function scrape(url: string) {
	const res = await fetch(url);

	return cheerio.load(await res.text());
}

async function scrapeSemesters() {
	const $ = await scrape("https://www.umass.edu/registrar/calendars/academic-calendar");

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
			year: year,
			startDate: startDate.date,
			endDate: endDate.date,
			significantDates: semesterDates,
		});
	}

	return updated;
}

async function scrapeCICS(updated: Map<string, Course>) {
	let $ = await scrape("https://web.cs.umass.edu/csinfo/autogen/cmpscicoursesfull.html");

	// Get list of courses from https://web.cs.umass.edu/csinfo/autogen/cmpscicoursesfull.html
	for (const course of $("table > tbody > tr:not(:first-child)").toArray()) {
		const attributes = $(course)
			.children("td")
			.toArray()
			.map(x => $(x).text());

		const id = `${attributes[0]} ${attributes[1]}`;
		updated.set(id, {
			id: id,
			title: attributes[2],
			credits: attributes[3],
			mostRecentSemester: "This course has not been offered since before Spring 2017.",
			frequency: attributes[4],
		});
	}

	const currentYear = new Date().getFullYear() % 2000;
	const semesterNames: Record<number, string> = {
		3: "Spring",
		5: "Summer",
		7: "Fall",
	};

	const processedMap = new Map<string, boolean>();
	for (let year = currentYear + 1; year >= 17; year--) {
		for (let semester = 7; semester >= 3; semester -= 2) {
			$ = await scrape(`https://web.cs.umass.edu/csinfo/autogen/cicsdesc1${year}${semester}.html`);

			if ($("title:contains('404 Not Found')").length !== 0) continue;

			const currentSemester = `${semesterNames[semester]} 20${year}`;
			for (const titleElement of $("h2:not(:first-child)").toArray()) {
				const fullTitle = $("a", titleElement).text().trim();
				const [id, title] = fullTitle.split(": ");

				const header = $(titleElement).next("h3");
				let course = updated.get(id);
				if (course === undefined) {
					course = {
						id: id,
						title: title,
						mostRecentSemester: currentSemester,
					};

					updated.set(id, course);
				}

				if (!processedMap.get(id)) {
					course.description = $(header).next("p").text();

					if (course.credits === undefined) {
						const match = course.description.match(/(1|2|3|4) credit[s]?./i);
						if (match && match[1]) course.credits = match[1];
					}

					course.mostRecentSemester = currentSemester;
					if (header.length > 0) {
						course.staff = header
							.text()
							.split(": ")[1]
							.split(", ")
							.reduce((a, x) => {
								if (x !== "STAFF") a.push(x);

								return a;
							}, new Array<string>());
					}

					processedMap.set(id, true);
				}
			}
		}
	}
}

async function scrapeMath(updated: Map<string, Course>) {
	let $ = await scrape("https://www.math.umass.edu/course-offerings");

	for (const course of $("table > tbody > tr").toArray()) {
		const attributes = $(course)
			.children("td")
			.toArray()
			.map(x => $(x).text().trim());

		const id = attributes[0].toUpperCase();
		updated.set(id, {
			id: id,
			title: attributes[1],
			mostRecentSemester: "This course has not been offered since before Spring 2017.",
			frequency: attributes[2].replace("/", " and "),
		});
	}

	const processedMap = new Map<string, boolean>();

	const min = 87;
	$ = await scrape("https://www.math.umass.edu/course-descriptions");
	const query = $("#edit-semester-tid > option:first-child");
	const start = Number.parseInt(query[0].attribs["value"]);

	for (let i = start; i >= min; i--) {
		$ = await scrape(`https://www.math.umass.edu/course-descriptions?semester_tid=${i}`);
		const semester = $("#edit-semester-tid > option:selected").text();

		for (const article of $("div > article").toArray()) {
			const header = $(":first-child > :first-child > :first-child", article).text().trim();
			const description = $(
				"div[class='field-course-descr-description inline clearfix'] > div:first-child > p:first-child",
				article,
			).text();
			const prerequisites = $(
				"div[class='field-course-descr-prereq inline clearfix'] > div:first-child > p:first-child",
				article,
			).text();

			const split = header.split(":");
			const id = split[0].split(".")[0];
			const title = split[1];

			if (!processedMap.get(id)) {
				const course = updated.get(id);

				const courseUpdate = course || {
					id: id,
					title: title,
				};

				courseUpdate.description = description;
				courseUpdate.mostRecentSemester = semester;

				if (prerequisites.length > 0) {
					const prerequisitesMatches = prerequisites.match(
						/(?<=\W)(cs|math|stat|cics|info)\s*\d{3}[a-z]*(?=\W)/gi,
					);

					if (prerequisitesMatches !== null) {
						courseUpdate.prerequisites = new Map<string, boolean>(
							prerequisitesMatches.map(x => [x.toUpperCase(), true]),
						);
					}
				}

				if (course === undefined) updated.set(id, courseUpdate);
				processedMap.set(id, true);
			}
		}
	}
}

async function scrapeCourses() {
	const updated = new Map<string, Course>();

	await scrapeCICS(updated);
	await scrapeMath(updated);

	return updated;
}

async function update(): Promise<boolean> {
	let wasSuccessful = true;

	try {
		semesters = await scrapeSemesters();
	} catch (e) {
		wasSuccessful = false;
		console.error(`Unable to scrape semester data: ${e}`);
	}

	try {
		courseMap = await scrapeCourses();
	} catch (e) {
		wasSuccessful = false;
		console.error(`Unable to scrape course data: ${e}`);
	}

	return wasSuccessful;
}

cron.schedule("* * 0 * * *", update);

export default update();
