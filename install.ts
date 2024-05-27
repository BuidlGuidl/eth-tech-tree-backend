import * as fs from "fs/promises";
import { fetchChallenges, execute } from "./utils/";
import { type Challenge } from "./types";
import { exec as execCb } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);

const setupChallenge = async (challenge: Challenge): Promise<void> => {
  try {
    const path = `./${challenge.name}`;
    const exists = await fs
      .access(path)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.log(`👯...CLONING ${challenge.name}...👯`);
      const cloneBranchCommand = `git clone -b ${challenge.name} ${challenge.github} ${challenge.name}`;
      await execute(cloneBranchCommand);
    }

    console.log(`🛠️...UPDATING ${challenge.name}...🛠️`);
    const updateChallengeCommand = `cd ${challenge.name} && git pull && yarn install`;
    await execute(updateChallengeCommand);
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
