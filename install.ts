import * as fs from "fs/promises";
import { fetchChallenges, executeCommand } from "./utils/";
import { type Challenge } from "./types";

const setupChallenge = async (challenge: Challenge): Promise<void> => {
  try {
    const path = `./${challenge.name}`;
    const exists = await fs
      .access(path)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.log(`👯...CLONING ${challenge.name}...👯`);
      const cloneBranch = `git clone -b ${challenge.name} ${challenge.github} ${challenge.name}`;
      await executeCommand(cloneBranch);
    }

    console.log(`🛠️...UPDATING ${challenge.name}...🛠️`);
    const updateChallenge = `cd ${challenge.name} && git pull && yarn install`;
    await executeCommand(updateChallenge);
  } catch (e) {
    console.error(e);
  }
};

const main = async (): Promise<void> => {
  const challenges = await fetchChallenges();
  for (const challenge of challenges) {
    await setupChallenge(challenge);
  }
};

main();
