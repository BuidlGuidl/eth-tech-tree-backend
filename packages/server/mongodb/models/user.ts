import mongoose, { Model, Schema } from "mongoose";

export interface IGasReport {
  functionName: string;
  gasUsed: number;
}

export interface IUserChallenge {
  challengeName: string
  status: string;
  lastFeedback: string;
  timestamp: Date;
  contractAddress: string;
  network: string;
  gasReport?: IGasReport[];
}

export interface IUser {
  address: string;
  ens: string;
  creationDate: Date;
  challenges: IUserChallenge[];
  installLocations?: IInstallLocation[];
}

export interface IInstallLocation {
  location: string;
  device: string;
}

interface IUserModel extends Model<IUser, object> {}

const GasReportSchema = new Schema<IGasReport>({
  functionName: {
    type: String,
    required: true,
  },
  gasUsed: {
    type: Number,
    required: true,
  },
}, { _id: false });

const InstallLocationSchema = new Schema<IInstallLocation>({
  location: {
    type: String,
    required: true,
  },
  device: {
    type: String,
    required: true,
  },
}, { _id: false });

const UserChallengeSchema = new Schema<IUserChallenge>({
  challengeName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
  },
  lastFeedback: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  contractAddress: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    required: true,
  },
  gasReport: [GasReportSchema],
}, { _id: false });

const UserSchema = new Schema<IUser, IUserModel>({
  address: {
    type: String,
    required: true,
  },
  ens: String,
  creationDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  challenges: [UserChallengeSchema],
  installLocations: [InstallLocationSchema],
});

const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
