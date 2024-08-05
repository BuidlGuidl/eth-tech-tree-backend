// TO BE RUN AS STANDALONE SCRIPT WITH MONGODB_URI ENV e.g. `MONGODB_URI=mongodb://localhost:27017/your-db-name yarn seed`

import dbConnect from "./dbConnect";
import User from "./models/user";
import Challenges from "./models/challenges";
import mongoose from "mongoose";
import fs from "fs";

const args = process.argv.slice(2);
const flags = args.filter(arg => arg.startsWith("--"));
const isReset = flags.includes("--reset");

const seedDb = async () => {
  const seedData = JSON.parse(fs.readFileSync("./mongodb/seed.sample.json", "utf8"));
  await dbConnect();
  const collectionsToSeed = [User, Challenges];
  for await (const collection of collectionsToSeed) {
    if (isReset) {
      await (collection as mongoose.Model<any>).deleteMany({});
    }
    const numDocs = await collection.countDocuments();
    const collectionExists = numDocs > 0;
    if (!collectionExists || isReset) {
      console.log(`Seeding db with ${collection.modelName} data...`);
      const result = await (collection as mongoose.Model<any>).insertMany(
        seedData[collection.modelName.toLowerCase() as keyof typeof seedData],
      );
      console.log(`${result.length} documents inserted.`);
    } else {
      console.log(`${collection.modelName} already exists. Skipping seeding.`);
    }
  }
  console.log("Seeding complete.");
  process.exit();
};

seedDb();
