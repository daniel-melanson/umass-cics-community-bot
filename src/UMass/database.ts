import { spawnSync } from "child_process";

import Mongo from "mongodb";

import { Staff, Semester, Course } from "UMass/types";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const UPDATE_TIME = DAY * 3;

let currentDatabase = "umass_1";
function connectToDatabase(): Promise<Mongo.Db> {
	return new Promise((res, rej) => {
		const client = new Mongo.MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
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

async function updateDatabase(recursive?: boolean) {
	const nextDatabase = currentDatabase === "umass_0" ? "umass_1" : "umass_0";

	console.log("[DATABASE] Updating...");
	try {
		const client = new Mongo.MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
		await client.connect();

		await client.db(nextDatabase).dropDatabase();
		const childResult = spawnSync("/usr/bin/python3.8", [process.env["DATABASE_UPDATER_PATH"]!, nextDatabase], {
			timeout: 2 * HOUR,
		});

		if (childResult.error) {
			throw childResult.error;
		} else if (childResult.output.some(x => x && x.length > 0)) {
			throw new Error("Unexpected output: " + childResult.output.toString());
		} else {
			console.log("[DATABASE] Finished updated.");
			currentDatabase = nextDatabase;
			if (recursive) setTimeout(updateDatabase, UPDATE_TIME, true);
		}
	} catch (e) {
		console.warn("[DATABASE] Unable to update next database.\n", e);

		if (recursive) setTimeout(updateDatabase, HOUR, true);
	}
}
setTimeout(updateDatabase, 3 * HOUR);
setTimeout(updateDatabase, UPDATE_TIME, true);
