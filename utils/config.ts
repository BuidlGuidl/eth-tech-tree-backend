import dotenv from "dotenv";
dotenv.config();

export const allowedNetworks = ["sepolia"];
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
