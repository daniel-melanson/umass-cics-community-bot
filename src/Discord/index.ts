import cron from "node-cron";
import calendar from "CICS/calendar";
import courses from "CICS/courses";

async function update() {
	await calendar.update();
	await courses.update();
}

cron.schedule("* * 0 * * *", update);

update().catch(e => {
	console.error(`Error on first update: ${e}`);
	process.exit(-1);
});

/*
registerFont("./assets/arial-bold.ttf", {
	family: "arial",
});

//cron.schedule("* * 0 * * 1", );

(() => {
	const semester = calendar.getCurrentSemester();
	if (!semester) return;

	const { startDate, endDate } = semester;
	const endTime = endDate.getTime();
	const totalTime = endTime - startDate.getTime();

	const percent = Math.floor(((endTime - new Date().getTime()) / totalTime) * 100);

	const img = new Canvas(400, 150);
	const context = img.getContext("2d");
	const text = `We are ${percent}% through the semester.`;

	context.font = "25px arial";
	const textSize = context.measureText(text);

	context.fillStyle = "#FFFFFF";
	context.fillText(text, img.width / 2 - textSize.width / 2 + 20, 25, img.width - 50);
	context.strokeText(text, img.width / 2 - textSize.width / 2, 25, img.width - 50);

	fs.writeFileSync("./img.png", img.toBuffer());
})();
*/
