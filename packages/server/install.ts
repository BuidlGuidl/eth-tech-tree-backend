import * as fs from "fs/promises";
import { execa } from "execa";
import {  EXTENSION_REPO } from "./utils";
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
      const extensionSource = `${EXTENSION_REPO}:${challenge.name}-extension`;
      await execa("create-eth", ["-e", extensionSource, challenge.name], { stdio: "inherit", cwd: challengesDirectory });
      console.log("Copying over default contract");
      const defaultContractPath = `${path}/packages/foundry/contracts/${challenge.contractName}`;
      const extraContractPath = `${path}/packages/foundry/extra/I${challenge.contractName}`;
      await fs.copyFile(extraContractPath, defaultContractPath);
      console.log(`Removing NextJS directory from ${challenge.name}`);
      await fs.rm(`${path}/packages/nextjs`, { recursive: true });
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
