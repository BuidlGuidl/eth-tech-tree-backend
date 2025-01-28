import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface LeaderboardUser {
  address: string;
  // Add other leaderboard fields as needed
}

interface UserChallenge {
  challengeName: string;
  status: string;
  network: string;
  contractAddress: string;
  timestamp: string;
}

interface SubmitPayload {
  challengeName: string;
  network: string;
  contractAddress: string;
  userAddress: string;
}

const BASE_SERVER_URL = "https://ethdevtechtree.buidlguidl.com";

// Add logging utilities
const LOG_DIR = path.join(__dirname, 'logs');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `migration-${timestamp}.log`);

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

async function fetchLeaderboard(): Promise<LeaderboardUser[]> {
  try {
    const response = await axios.get(`${BASE_SERVER_URL}/leaderboard`);
    return response.data.leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

async function fetchUserChallenges(address: string): Promise<UserChallenge[]> {
  try {
    const response = await axios.get(`${BASE_SERVER_URL}/user/${address}`);
    return response.data.user.challenges;
  } catch (error) {
    console.error(`Error fetching challenges for user ${address}:`, error);
    return [];
  }
}

async function submitChallenge(payload: SubmitPayload): Promise<boolean> {
  try {
    if (!payload.challengeName || !payload.network || !payload.contractAddress || !payload.userAddress) {
      const errorMsg = `Invalid payload: ${JSON.stringify(payload, null, 2)}`;
      appendToLog(errorMsg);
      return false;
    }

    appendToLog(`Attempting submission: ${JSON.stringify(payload, null, 2)}`);

    const response = await axios.post('http://localhost:3000/submit', payload);
    appendToLog(`Successfully submitted challenge ${payload.challengeName} for user ${payload.userAddress}`);
    appendToLog(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return response.data.result.passed;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMsg = `Error submitting challenge:\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data)}\nPayload: ${JSON.stringify(payload, null, 2)}`;
      appendToLog(errorMsg);
    } else {
      appendToLog(`Unknown error submitting challenge: ${error}`);
    }
  }
  return false;
}

async function main() {
  ensureLogDir();
  appendToLog('Starting migration script');

  const users = await fetchLeaderboard();
  appendToLog(`Found ${users.length} users on leaderboard`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of users) {
    appendToLog(`Processing user ${user.address}`);
    
    const challenges = await fetchUserChallenges(user.address);
    appendToLog(`Found ${challenges.length} challenges for user ${user.address}`);
    
    for (const challenge of challenges) {
      if (challenge.status === 'success') {
        appendToLog(`Processing challenge: ${challenge.challengeName}`);

        const payload: SubmitPayload = {
          challengeName: challenge.challengeName,
          network: challenge.network || 'sepolia',
          contractAddress: challenge.contractAddress,
          userAddress: user.address
        };
        
        try {
          const passed = await submitChallenge(payload);
          if (passed) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          appendToLog(`Failed to process challenge: ${error}`);
        }
      }
    }
  }

  appendToLog(`Migration completed. Successful submissions: ${successCount}, Errors: ${errorCount}`);
}

// Execute the script
main()
  .then(() => {
    appendToLog('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    appendToLog(`Script failed: ${error}`);
    process.exit(1);
  });
