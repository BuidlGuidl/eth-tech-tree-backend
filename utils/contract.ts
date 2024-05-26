import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { allowedNetworks, ETHERSCAN_API_KEY } from "./config";
import { isAddress } from "viem";
import { type SubmissionConfig } from "../types";
import fs from "fs";

const copyContractFromEtherscan = async ({
  challenge,
  network,
  address,
}: SubmissionConfig) => {
  if (!allowedNetworks.includes(network)) {
    throw new Error(`${network} is not a valid testnet`);
  }

  const API_URL = `https://api-${network}.etherscan.io/api`;
  const paramString = `?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`;

  let sourceCodeParsed;
  try {
    const response = await axios.get(API_URL + paramString);
    // The Etherscan API returns OK / NOTOK
    if (response.data.message !== "OK") {
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
      console.log();
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

    return true;
  } catch (e) {
    // Issue with the Request.
    console.error(e);
    throw e;
  }
};

export const downloadAndTestContract = async ({
  challenge,
  network,
  address,
}: SubmissionConfig) => {
  // Validate the submission config
  if (!isAddress(address)) {
    throw new Error(`${address} is not a valid address.`);
  }
  if (!allowedNetworks.includes(network)) {
    throw new Error(`"${network}" is not a valid testnet.`);
  }

  try {
    console.log(`📡 Downloading contract from ${network}`);
    copyContractFromEtherscan({ challenge, network, address });
  } catch (e) {
    throw e;
  }
};
