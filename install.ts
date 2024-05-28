import * as fs from "fs/promises";
import { fetchChallenges, execute } from "./utils/";
import { type Challenge } from "./types";

/**
 * This script clones all the branches from the eth-tech-tree-challenges repo and installs the dependencies
 * Each branch is cloned into the `challenges/` directory of this repo
 */
const setupChallenge = async (challenge: Challenge): Promise<void> => {
  try {
    const path = `./${challenge.name}`;
    const exists = await fs
      .access(path)
      .then(() => true)
      .catch(() => false);

    if (!exists) {
      console.log(`👯...CLONING ${challenge.name}...👯`);
      const cloneBranchCommand = `git clone -b ${challenge.name} ${challenge.github} challenges/${challenge.name}`;
      await execute(cloneBranchCommand);
    }

    console.log(`🛠️...UPDATING ${challenge.name}...🛠️`);
    // w/o the `forge install` the submodules won't be installed for some reason
    const updateChallengeCommand = `cd challenges/${challenge.name} && git pull && yarn install && cd packages/foundry && forge install`;
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
