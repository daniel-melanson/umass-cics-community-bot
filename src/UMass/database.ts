import { exec } from "child_process";

import Mongo from "mongodb";

import { Staff, Semester, Course } from "UMass/types";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const UPDATE_TIME = DAY * 7;

let currentDatabase = "umass_0";
function connectToDatabase(): Promise<Mongo.Db> {
	return new Promise((res, rej) => {
		const client = new Mongo.MongoClient(CONNECTION_STRING.replace("DATABASE", currentDatabase), {
			useUnifiedTopology: true,
		});
		client
			.connect()
			.then(() => res(client.db(currentDatabase)))
			.catch(error => rej(error));
	});
}

type UMassCollection = "staff" | "courses" | "semesters";
type UMassCollectionData<T> = T extends "staff"
	? Staff
	: T extends "courses"
	? Course
	: T extends "semesters"
	? Semester
	: never;
export async function connectToCollection<T extends UMassCollection>(
	collection: T,
): Promise<Mongo.Collection<UMassCollectionData<T>>> {
	const db = await connectToDatabase();

	return db.collection(collection);
}

function updateDatabase(_recursive = false): void {
	const nextDatabase = currentDatabase === "umass_0" ? "umass_1" : "umass_0";
	const client = new Mongo.MongoClient(CONNECTION_STRING, {
		useUnifiedTopology: true,
	});

	console.log("[DATABASE] Setting up update...");
	client
		.connect()
		.then(client =>
			client
				.db(nextDatabase)
				.dropDatabase()
				.then(() => {
					console.log("[DATABASE] Scraping...");
					exec(
						`/usr/bin/python3.8 ${process.env["DATABASE_UPDATER_PATH"]} ${nextDatabase}`,
						{
							timeout: 2 * HOUR,
						},
						(error, stdout, stderr) => {
							if (error) {
								console.log(`[DATABASE - ${new Date().toLocaleString()}] Unable to update: ${error}\n\n`);
								console.log(stdout, stderr);
							} else {
								console.log(`[DATABASE - ${new Date().toLocaleString()}] Successfully updated.`);
								currentDatabase = nextDatabase;
							}
						},
					);
				})
				.catch(e => console.log("[DATABASE] Failed to dropDatabase: " + e)),
		)
		.catch(e => console.log("[DATABASE] Failed to connect while updating: " + e));

	if (_recursive) setTimeout(updateDatabase, UPDATE_TIME, true);
}

if (process.env["UPDATE"]) {
	setTimeout(updateDatabase, 3 * HOUR);
	setTimeout(updateDatabase, UPDATE_TIME, true);
}
