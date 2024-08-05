import mongoose, { Model, Schema } from "mongoose";

export interface IChallenge {
    type: string;
    level: number;
    name: string;
    label: string;
    repo: string;
    tags: string[];
    contractName: string;
    testFileName: string;
    childrenNames: string[];
    enabled: boolean;
    description: string;
  }

interface IChallengeModel extends Model<IChallenge, object> {}

const ChallengeSchema = new Schema<IChallenge, IChallengeModel>({
  type: String,
  level: { type: Number, required: true },
  name: { type: String, required: true },
  label: { type: String, required: true },
  repo: { type: String, required: true },
  tags: [String],
  contractName: String,
  testFileName: String,
  childrenNames: [String],
  enabled: { type: Boolean, default: false },
  description: String,
});

const Challenge =
  (mongoose.models.Challenge as IChallengeModel) || mongoose.model<IChallenge, IChallengeModel>("Challenge", ChallengeSchema);

export default Challenge;
