import * as fs from "fs/promises";
import { exec as execCb } from "child_process";
import { promisify } from "util";
const exec = promisify(execCb);

interface Challenge {
  name: string;
  github: string;
}

const fetchChallenges = async (): Promise<Challenge[]> => {
  const data = await fs.readFile("challenges.json", { encoding: "utf8" });
  return JSON.parse(data);
};

async function executeCommand(command: string): Promise<void> {
  const { stdout, stderr } = await exec(command);
  if (stderr) {
    console.error(`stderr: ${stderr}\n`);
  }
  console.log(`stdout: ${stdout}\n`);
}

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
