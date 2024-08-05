import dbConnect from "../mongodb/dbConnect";
import Challenge, { IChallenge } from "../mongodb/models/challenges";

/**
 * Fetch metadata for all the challenges
 */
export const fetchChallenges = async (): Promise<IChallenge[]> => {
  await dbConnect();
  const challenges = await Challenge.find({});
  return challenges;
};

/**
 * Fetch metadata for a single challenge
 */
export const fetchChallenge = async (
  challengeName: string
): Promise<IChallenge> => {
  const challenges = await fetchChallenges();
  const challenge = challenges.find((c) => c.name === challengeName);
  if (!challenge) {
    throw new Error(`Challenge "${challengeName}" not found.`);
  }

  const challengeMetadata = challenge;
  return challengeMetadata;
};
