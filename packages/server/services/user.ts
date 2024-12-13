import dbConnect from "../mongodb/dbConnect";
import User, { IGasReport, IUser } from "../mongodb/models/user";
import { getEnsName, getEnsAddress } from "./ens";
import Challenge, { IChallenge } from "../mongodb/models/challenges";

/**
 * Fetch a user
 */
export const fetchUser = async (
  identifier: string
): Promise<IUser> => {
  await dbConnect();
  // Fetch user by address or ENS name
  const user = await User.findOne({ $or: [{ address: identifier }, { ens: identifier }] }, "-_id -__v");

  return (user?.toObject() || {}) as IUser;
};

/**
 * Search for existing submitted challenge at the given address
 */
export const fetchUserWithChallengeAtAddress = async (contractAddress: string): Promise<IUser | null> => {
  await dbConnect();
  const user = await User.findOne({ "challenges.contractAddress": contractAddress }, "-_id -__v");

  return user;
};

/**
 * Create a new user
 */
export const createUser = async (
  address: string,
  ens: string,
  device: string,
  location: string
): Promise<IUser> => {
  await dbConnect();
  if (!address) {
    address = (await getEnsAddress(ens)) as string;
    if (!address) {
      throw new Error("ENS name could not be resolved");
    }
  }
  if (!ens) {
    ens = await getEnsName(address) as string;
  }
  const installLocations = { location, device };
  await User.findOneAndUpdate({ address }, { address, ens, $push: { installLocations } }, { upsert: true });
  const user = await User.findOne({ address }, "-_id -__v");
  return user as IUser;
}

/**
 * Update a user's challenge submission
 */
export const updateUserChallengeSubmission = async (
  address: string,
  challengeName: string,
  contractAddress: string,
  network: string,
  status: string,
  gasReport?: IGasReport[],
  error?: string

): Promise<void> => {
  await dbConnect();
  // Remove existing challenge submission (if any)
  await User.updateOne({ address }, { $pull: { challenges: { challengeName } } });
  // Add new challenge submission
  await User.updateOne({ address }, { $push: { challenges: { challengeName, contractAddress, network, status, gasReport, error } } });

  // Only update points if the challenge succeeded or failed
  if (status != "pending") {
    // Update user's points and totalGasUsed
    const user = await User.findOne({ address });
    if (user) {
      const completedUserChallenges = user.challenges.filter(challenge => challenge.status === "success");
      const completedChallenges = await Promise.all(
        completedUserChallenges
          .map(async challenge => {
            const fullChallenge = await Challenge.findOne({ name: challenge.challengeName });
            return fullChallenge as IChallenge;
          })
      );

      const points = calculatePoints(completedChallenges);

      const totalGasUsed = completedUserChallenges.reduce((acc, challenge) => {
        if (challenge.gasReport) {
          return acc + challenge.gasReport.reduce((gasAcc, func) => gasAcc + func.gasUsed, 0);
        }
        return acc;
      }, 0);

      await User.updateOne({ address }, { points, totalGasUsed });
    }
  }
};

/**
 * Calculate points based on completed challenges
 */
export const calculatePoints = (completedChallenges: IChallenge[]): number => {
  const pointsPerLevel = [100, 150, 225, 300, 400, 500];
  return completedChallenges
    .reduce((total, challenge) => {
      const points = pointsPerLevel[challenge!.level - 1] || 100;
      return total + points;
    }, 0);
};
