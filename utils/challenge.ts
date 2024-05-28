import * as fs from "fs/promises";
import { Challenge } from "../types";

/**
 * Fetch metadata for all the challenges
 */
export const fetchChallenges = async (): Promise<Challenge[]> => {
  const data = await fs.readFile("challenges.json", { encoding: "utf8" });
  const challenges = JSON.parse(data);
  return challenges;
};

/**
 * Fetch metadata for a single challenge
 */
export const fetchChallenge = async (
  challengeId: number
): Promise<Challenge> => {
  const challenges = await fetchChallenges();

  if (!challenges[challengeId]) {
    throw new Error(`Challenge "${challengeId}" not found.`);
  }

  const challengeMetadata = challenges[challengeId];
  return challengeMetadata;
};
