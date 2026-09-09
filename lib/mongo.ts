import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

export const DB_NAME = process.env.MONGODB_DB || "haat";
export const SHOPS_COLLECTION = "shops";
export const REPORTS_COLLECTION = "reports";
export const USERS_COLLECTION = "users";

declare global {
  var __haatMongoClientPromise: Promise<MongoClient> | undefined;
}

/** Returns a cached MongoClient promise, or null when MONGODB_URI is not configured. */
export function mongo(): Promise<MongoClient> | null {
  if (!uri) return null;
  if (!global.__haatMongoClientPromise) {
    global.__haatMongoClientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 4000,
      maxPoolSize: 8,
    }).connect();
  }
  return global.__haatMongoClientPromise;
}

let indexed = false;
export async function ensureIndexes(client: MongoClient) {
  if (indexed) return;
  const db = client.db(DB_NAME);
  await db.collection(SHOPS_COLLECTION).createIndex({ slug: 1 }, { unique: true });
  await db.collection(REPORTS_COLLECTION).createIndex({ id: 1 }, { unique: true });
  await db.collection(USERS_COLLECTION).createIndex({ email: 1 }, { unique: true });
  indexed = true;
}
