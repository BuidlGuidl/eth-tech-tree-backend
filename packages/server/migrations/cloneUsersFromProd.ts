import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Logging setup
const LOG_DIR = path.join(__dirname, 'logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `clone-db-${timestamp}.log`);

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function appendToLog(message: string) {
  const timestampedMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, timestampedMessage);
  console.log(message);
}

async function cloneCollection() {
  // Connection URLs
  const sourceUrl = process.env.SOURCE_MONGODB_URI || 'mongodb://localhost:27017/source_db';
  const targetUrl = process.env.TARGET_MONGODB_URI || 'mongodb://localhost:27017/eth-tech-tree';
  
  // Collection name to clone
  const collectionName = process.env.COLLECTION_NAME || 'users';

  let sourceClient: MongoClient | null = null;
  let targetClient: MongoClient | null = null;

  try {
    // Connect to both databases
    sourceClient = await MongoClient.connect(sourceUrl);
    targetClient = await MongoClient.connect(targetUrl);

    appendToLog('Connected to both databases successfully');

    // Get database names from connection strings
    const sourceDbName = 'test';
    const targetDbName = 'eth-tech-tree';

    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    // Get the collections
    const sourceCollection = sourceDb.collection(collectionName);
    const targetCollection = targetDb.collection(collectionName);

    // Get count of documents in source
    const totalDocs = await sourceCollection.countDocuments();
    appendToLog(`Found ${totalDocs} documents in source collection`);

    // Optional: Clear target collection first
    if (process.env.CLEAR_TARGET === 'true') {
      appendToLog('Clearing target collection...');
      await targetCollection.deleteMany({});
    }

    // Fetch all documents from source
    const cursor = sourceCollection.find({});
    let processedCount = 0;
    let errorCount = 0;

    // Process documents in batches
    const BATCH_SIZE = 100;
    let batch: any[] = [];

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) continue;

      batch.push(doc);
      
      if (batch.length >= BATCH_SIZE) {
        try {
          await targetCollection.insertMany(batch, { ordered: false });
          processedCount += batch.length;
          appendToLog(`Processed ${processedCount}/${totalDocs} documents`);
        } catch (error) {
          errorCount += 1;
          appendToLog(`Error inserting batch: ${error}`);
        }
        batch = [];
      }
    }

    // Insert remaining documents
    if (batch.length > 0) {
      try {
        await targetCollection.insertMany(batch, { ordered: false });
        processedCount += batch.length;
      } catch (error) {
        errorCount += 1;
        appendToLog(`Error inserting final batch: ${error}`);
      }
    }

    appendToLog(`Clone completed. Processed ${processedCount} documents with ${errorCount} errors`);

  } catch (error) {
    appendToLog(`Fatal error during clone: ${error}`);
    throw error;
  } finally {
    // Close connections
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
    appendToLog('Database connections closed');
  }
}

// Execute the script
ensureLogDir();
appendToLog('Starting database clone process');

cloneCollection()
  .then(() => {
    appendToLog('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    appendToLog(`Script failed: ${error}`);
    process.exit(1);
  });
