import dbConnect from "../mongodb/dbConnect";
import User, { IUser } from "../mongodb/models/user";

/**
 * Fetch metadata for a single challenge
 */
export const fetchUser = async (
  address: string
): Promise<IUser> => {
  await dbConnect();
  const user = await User.findOne({ address: address });

  return (user?.toObject() || {}) as IUser;
};
