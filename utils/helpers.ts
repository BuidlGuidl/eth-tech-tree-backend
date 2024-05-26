import * as fs from "fs/promises";
import { Challenge } from "../types";

export const fetchChallenges = async (): Promise<Challenge[]> => {
  const data = await fs.readFile("challenges.json", { encoding: "utf8" });
  return JSON.parse(data);
};
