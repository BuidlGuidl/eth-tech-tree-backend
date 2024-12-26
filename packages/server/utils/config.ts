import dotenv from "dotenv";
dotenv.config({ path: ['../../.env.local', '../../.env'] });

export const ALLOWED_NETWORKS = ["sepolia"];
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT || 3000;
export const SERVER_CERT = process.env.SERVER_CERT || "server.cert";
export const SERVER_KEY = process.env.SERVER_KEY || "server.key";