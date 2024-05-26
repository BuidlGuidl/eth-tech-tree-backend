import axios from "axios";
import { ETHERSCAN_API_KEY } from "./config";
import { type SubmissionConfig } from "../types";
import fs from "fs";

/**
 * 1. Fetch the contract source code from Etherscan
 * 2. Save the contract source code into the appropriate challenge directory
 */
export const downloadContract = async ({
  challenge,
  network,
  address,
}: SubmissionConfig): Promise<boolean> => {
  const API_URL = `https://api-${network}.etherscan.io/api`;
  const paramString = `?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`;

  let sourceCodeParsed;
  try {
    console.log(`📡 Downloading contract from ${network}`);
    const response = await axios.get(API_URL + paramString);
    // The Etherscan API returns OK / NOTOK
    if (response.data.message !== "OK") {
      console.log(response.data);
      return false;
    }

    // On "sourceCode" Etherscan return 3 possible values:
    // 1. A string (on flattened contracts)
    // 2. An almost-valid JSON :( (on splitted verified contracts)
    // 3. A valid JSON (on _some_ splitted verified contracts)
    const sourceCode = response?.data?.result?.[0]?.SourceCode;
    if (!sourceCode) {
      throw new Error(
        "Contract Source Code is not valid. Is the Contract verified?"
      );
    }

    try {
      // Option 3. A valid JSON
      const parsedJson = JSON.parse(sourceCode);
      sourceCodeParsed = parsedJson?.[`${challenge.contractName}.sol`]?.content;
    } catch (e) {
      if (sourceCode.slice(0, 1) === "{") {
        // Option 2. An almost valid JSON
        // Remove the initial and final { }
        const validJson = JSON.parse(sourceCode.substring(1).slice(0, -1));

        sourceCodeParsed =
          validJson?.sources[`contracts/${challenge.contractName}.sol`]
            ?.content ??
          validJson?.sources[`./contracts/${challenge.contractName}.sol`]
            ?.content;
      } else {
        // Option 1. A string
        sourceCodeParsed = sourceCode;
      }
    }

    if (!sourceCodeParsed) {
      throw new Error(
        `Contract Source Code is not valid. Are you submitting ${challenge.contractName}.sol Contract Address?`
      );
    }

    const path = `${challenge.name}/packages/foundry/contracts/download-${address}.sol`;
    fs.writeFileSync(path, sourceCodeParsed);
    console.log(`📝 Contract saved at ${path}`);
    return true;
  } catch (e) {
    // Issue with the Request.
    console.error(e);
    throw e;
  }
};
