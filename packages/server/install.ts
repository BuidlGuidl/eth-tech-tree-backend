import * as fs from "fs/promises";
import {  execute } from "./utils";
import { fetchChallenges } from "./services/challenge";
import { type IChallenge } from "./mongodb/models/challenges";

/**
 * This script clones all the branches from the eth-tech-tree-challenges repo and installs the dependencies
 * Each branch is cloned into the `challenges/` directory of this repo
 */
const setupChallenge = async (challenge: IChallenge): Promise<void> => {
  try {
    const challengesDirectory = `${__dirname}/challenges`;
    const path = `${challengesDirectory}/${challenge.name}`;
    const exists = await fs
      .access(path)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.log(`👯...Setting up ${challenge.name}...👯`);
      const setupChallengeCommand = `npx eth-tech-tree setup ${challenge.name} ${challengesDirectory}`;
      await execute(setupChallengeCommand);
    }
  } catch (e) {
    console.error(e);
  }
};

const main = async (): Promise<void> => {
  const challenges = await fetchChallenges();
  for (const challenge of challenges) {
    if (challenge.enabled) {
      await setupChallenge(challenge);
    }
  }
  console.log("🚀...SETUP COMPLETE...🚀");
};

main().then(() => process.exit(0));
