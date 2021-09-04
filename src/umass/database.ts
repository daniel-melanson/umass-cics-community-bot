import { exec } from "child_process";

import { Collection, Db, MongoClient } from "mongodb";
import { log, warn } from "../shared/logger";

import { Staff, Semester, Course } from "./types";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const UPDATE_TIME = DAY * 7;

let currentDatabase = "umass_0";
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

function updateDatabase(_recursive = false): void {
  const nextDatabase = currentDatabase === "umass_0" ? "umass_1" : "umass_0";
  const client = new MongoClient(CONNECTION_STRING);

  log("UMASS", "Initializing update...");
  client
    .connect()
    .then(client =>
      client
        .db(nextDatabase)
        .dropDatabase()
        .then(() => {
          log("UMASS", "Scraping...");
          exec(
            `/usr/bin/python3.8 ${process.env["DATABASE_UPDATER_PATH"]} ${nextDatabase}`,
            {
              timeout: 2 * HOUR,
            },
            (error, stdout, stderr) => {
              if (error) {
                warn("UMASS", "Scraping process failed.", error, stdout, stderr);
              } else {
                log("UMASS", "Scraping process succeeded. Update finished.");
                currentDatabase = nextDatabase;
              }
            },
          );
        })
        .catch(e => warn("UMASS", "Failed to drop database.", e)),
    )
    .catch(e => warn("UMASS", "Failed to connect while updating.", e));

  if (_recursive) setTimeout(updateDatabase, UPDATE_TIME, true);
}

if (process.env["UPDATE"]) {
  setTimeout(updateDatabase, 3 * HOUR);
  setTimeout(updateDatabase, UPDATE_TIME, true);
}
