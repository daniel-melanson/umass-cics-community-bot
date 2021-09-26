import { exec, ExecOptions } from "child_process";

import { Collection, Db, MongoClient } from "mongodb";

import { log, warn } from "#shared/logger";

import { Staff, Semester, Course } from "./types";
import { fetchSemesters } from "./calendar";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const UPDATE_TIME = DAY * 7;

const currentDatabase = "umass_0";
async function connectToDatabase<T>(callback: (db: Db) => Promise<T>): Promise<T> {
  const client = await new MongoClient(CONNECTION_STRING.replace("DATABASE", currentDatabase)).connect();

  const r = await callback(client.db(currentDatabase));

  client.close();

  return r;
}

type UMassCollection = "staff" | "courses" | "semesters";
type UMassCollectionData<T> = T extends "staff"
  ? Staff
  : T extends "courses"
  ? Course
  : T extends "semesters"
  ? Semester
  : never;

export function connectToCollection<T extends UMassCollection, U>(
  collection: T,
  callback: (collection: Collection<UMassCollectionData<T>>) => Promise<U>,
): Promise<U> {
  return connectToDatabase(db => callback(db.collection(collection)));
}

function execAsync(command: string, options: ExecOptions) {
  return new Promise((res, rej) => {
    exec(command, options, (error, stdout) => {
      if (error) {
        rej(error);
      } else {
        res(stdout);
      }
    });
  });
}

function updateDatabase(_recursive = false): void {
  const nextDatabase = currentDatabase === "umass_0" ? "umass_1" : "umass_0";
  const client = new MongoClient(CONNECTION_STRING);

  log("UMASS", "Updating database...");
  client
    .connect()
    .then(client =>
      client
        .db(nextDatabase)
        .dropDatabase()
        .then(() => {
          log("UMASS", "Scraping...");

          return execAsync(`/usr/bin/python3.8 ${process.env["DATABASE_UPDATER_PATH"]} ${nextDatabase}`, {
            timeout: 2 * HOUR,
          });
        }),
    )
    .then(() => fetchSemesters())
    .then(() => log("UMASS", "Update successful."))
    .catch(e => warn("UMASS", "Update failed:", e));

  if (_recursive) setTimeout(updateDatabase, UPDATE_TIME, true);
}

if (process.env["UPDATE"]) {
  setTimeout(updateDatabase, 3 * HOUR);
  setTimeout(updateDatabase, UPDATE_TIME, true);
}
