const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "uddog_events";

let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedDb && cachedClient) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error("MONGODB_URI is missing in environment configuration.");
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    maxPoolSize: 10,
  });

  await client.connect();
  const db = client.db(dbName);

  // Ensure indexes for fast event sorting, filtering, and user lookups
  try {
    await db.collection("events").createIndex({ eventDate: 1 });
    await db.collection("events").createIndex({ eventType: 1 });
    await db.collection("events").createIndex({ creatorEmail: 1 });
    await db.collection("joined_events").createIndex({ userEmail: 1, eventDate: 1 });
    await db.collection("joined_events").createIndex({ eventId: 1, userEmail: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
  } catch (indexErr) {
    // Non-fatal if indexes already exist
  }

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

async function getCollections() {
  const { db } = await connectDB();
  return {
    db,
    usersCollection: db.collection("users"),
    eventsCollection: db.collection("events"),
    joinedEventsCollection: db.collection("joined_events"),
  };
}

module.exports = {
  connectDB,
  getCollections,
};

