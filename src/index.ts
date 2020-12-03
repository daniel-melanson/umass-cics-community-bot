import { schedule } from "node-cron";
import { config } from "dotenv";
config();

import { login, announce } from "Discord/server";

/*
const sameDay = (d0: Date, d1: Date) =>
	d0.getUTCDate() === d1.getUTCDate() &&
	d0.getUTCMonth() === d1.getUTCMonth() &&
	d0.getUTCFullYear() === d1.getUTCFullYear();
*/

function academicCalendarAnnouncement() {
	const today = new Date();
	const tomorrow = new Date(today.setDate(today.getDate() + 1));
	try {
		/*
		const semester = getCurrentSemester();
		if (semester !== undefined) {
			for (const event of semester.significantDates) {
				const date = event.date;
				if (sameDay(today, date)) {
					await announce("university", `Academic Calendar Notice (**TODAY**): ${event.description}`);
				} else if (sameDay(tomorrow, date)) {
					await announce("general", `Academic Calendar Notice (**TOMORROW**): ${event.description}`);
				}
			}
		}*/
	} catch (e) {
		console.warn(`Unable to post Academic Calendar Notice: ${e}`);
	}
}

function semesterPercentAnnouncement() {
	try {
		/*
		const semester = getCurrentSemester();
		if (semester !== undefined) {
			const remainingDays = Interval.fromDateTimes(
				DateTime.fromObject({ zone: "America/New_York" }),
				semester.endDate,
			).count("days");
			const semesterDays = Interval.fromDateTimes(semester.startDate, semester.endDate).count("days");

			announce(
				"general",
				`We are currently **${Math.floor(
					((semesterDays - remainingDays) / semesterDays) * 100,
				)}%** through the semester (Not including exams).`,
			);
		}*/
	} catch (e) {
		console.warn(`Unable to post semester percentage: ${e}`);
	}
}

login(process.env["DISCORD_TOKEN"]!).then(() => {
	if (process.env["DEBUG"]) return;

	const localSchedule = (exp: string, func: () => void) =>
		schedule(exp, func, {
			timezone: "America/New_York",
		});

	localSchedule("0 0 7 * * 1", semesterPercentAnnouncement);
	localSchedule("0 0 7 * * *", academicCalendarAnnouncement);
	//localSchedule("0 0 7 * * *", weeklyAcademicCalendarAnnouncement);
});
