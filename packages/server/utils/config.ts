import dotenv from "dotenv";
dotenv.config({ path: ['../../.env.local', '../../.env'] });

export const ALLOWED_NETWORKS = ["sepolia"];
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
