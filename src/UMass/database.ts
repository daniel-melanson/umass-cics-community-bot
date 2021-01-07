import { exec, ExecException } from "child_process";

import { MongoClient, MongoError, Collection, Db } from "mongodb";

import { Staff, Semester, Course } from "UMass/types";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const UPDATE_TIME = DAY * 3;

let currentDatabase = "umass_0";
function connectToDatabase(): Promise<Db> {
	return new Promise((res, rej) => {
		MongoClient.connect(CONNECTION_STRING, (error: MongoError, client: MongoClient) => {
			if (error) {
				return rej(error);
			}

			return res(client.db(currentDatabase));
		});
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
): Promise<Collection<UMassCollectionData<T>>> {
	const db = await connectToDatabase();

	return db.collection(collection);
}

function cmd(cmdStr: string) {
	return new Promise<string>((resolve, reject) => {
		exec(cmdStr, (error, stdout) => {
			if (error) {
				reject(error);
			}
			resolve(stdout);
		});
	}).catch((error: ExecException) => {
		throw new Error(`Command "${error.cmd}" exited with code ${error.code}\n\n${error.message}`);
	});
}

async function updateDatabase(recursive: boolean) {
	const nextDatabase = currentDatabase === "umass_0" ? "umass_1" : "umass_0";

	try {
		const client = new MongoClient(CONNECTION_STRING);
		await client.connect();

		client.db(nextDatabase).dropDatabase();
		await cmd(`${process.env["DATABASE_UPDATE_COMMAND"]} '${CONNECTION_STRING}' ${nextDatabase}`);

		currentDatabase = nextDatabase;
		if (recursive) setTimeout(updateDatabase, UPDATE_TIME, true);
	} catch (e) {
		console.warn("[DATABASE] Unable to update next database.\n", e);

		if (recursive) setTimeout(updateDatabase, HOUR, true);
	}
}
setTimeout(updateDatabase, 3 * HOUR, false);
setTimeout(updateDatabase, UPDATE_TIME, true);