import { Collection, MongoClient } from "mongodb";

import { Staff, Semester, Course } from "./types";

const CONNECTION_STRING = process.env["MONGO_CONNECTION_STRING"] || "";
const client = new MongoClient(CONNECTION_STRING);

type UMassCollection = "staff" | "courses" | "semesters";
type UMassCollectionData<T> = T extends "staff"
  ? Staff
  : T extends "courses"
  ? Course
  : T extends "semesters"
  ? Semester
  : never;

export async function connectToDatabase() {
  return await client.connect();
}

export async function closeDatabaseConnection() {
  return await client.close();
}

export async function connectToCollection<T extends UMassCollection, U>(
  collection: T,
  callback: (collection: Collection<UMassCollectionData<T>>) => Promise<U>,
): Promise<U> {
  return await callback(client.db().collection(collection));
}
