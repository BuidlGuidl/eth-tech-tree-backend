import mongoose, { Model, Schema } from "mongoose";

export interface IUserChallenge {
  status: string;
  lastFeedback: string;
  timestamp: number;
  contractAddress: string;
  network: string;
  gasReport?: {
    [key: string]: number;
  };
}

export interface IUser {
  address: string;
  ens: string;
  creationTimestamp: number;
  challenges: {
    [key: string]: IUserChallenge;
  };
}

interface IUserModel extends Model<IUser, object> {}

const UserChallengeSchema = new Schema<IUserChallenge>({
  status: {
    type: String,
    required: true,
  },
  lastFeedback: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  contractAddress: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    required: true,
  },
  gasReport: {
    type: Map,
    of: Number
  },
});

const UserSchema = new Schema<IUser, IUserModel>({
  address: {
    type: String,
    required: true,
  },
  ens: String,
  creationTimestamp: {
    type: Number,
    required: true,
  },
  challenges: { type: Map, of: UserChallengeSchema },
});

const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
