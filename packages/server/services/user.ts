import dbConnect from "../mongodb/dbConnect";
import User, { IGasReport, IUser, IUserChallenge } from "../mongodb/models/user";
import { getEnsName, getEnsAddress } from "./ens";

/**
 * Fetch a user
 */
export const fetchUser = async (
  address: string
): Promise<IUser> => {
  await dbConnect();
  const user = await User.findOne({ address: address });

  return (user?.toObject() || {}) as IUser;
};

/**
 * Search for existing submitted challenge at the given address
 */
export const fetchUserWithChallengeAtAddress = async (contractAddress: string): Promise<IUser | null> => {
  await dbConnect();
  const user = await User.findOne({ "challenges.contractAddress": contractAddress });

  return user;
};

/**
 * Create a new user
 */
export const createUser = async (
  address: string,
  ens: string
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
  await User.findOneAndUpdate({ address }, { address, ens }, {upsert: true});
  const user = await User.findOne({ address });
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
  gasReport?: IGasReport[]

): Promise<void> => {
  await dbConnect();
  // Remove existing challenge submission (if any)
  await User.updateOne({address}, { $pull: { challenges: { challengeName } } });
  // Add new challenge submission
  await User.updateOne({address}, { $push: { challenges: { challengeName, contractAddress, network, status, gasReport } } });
};
