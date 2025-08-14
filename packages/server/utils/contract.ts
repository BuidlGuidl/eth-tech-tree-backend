import axios from "axios";
import { ETHERSCAN_API_KEY, SUPPORTED_CHAINS, execute, type SupportedChain } from ".";
import { type SubmissionConfig } from "../types";
import fs from "fs";

// Rate limiter for Etherscan API (5 requests per second)
class EtherscanRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private readonly RATE_LIMIT_MS = 250; // 4 requests per second to stay safely under 5/sec

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await request();
      // Wait before processing the next request to respect rate limits
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS));
      }
    }
    this.processing = false;
  }
}

// Global rate limiter instance to handle concurrent users
const etherscanRateLimiter = new EtherscanRateLimiter();

const getContractCodeUrl = (chainId: string, contractAddress: string) => {
  const chain = SUPPORTED_CHAINS.find((c: SupportedChain) => c.chainid === chainId);
  if (!chain) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
};

const fetchContractFromChain = async (chainId: string, contractAddress: string) => {
  return etherscanRateLimiter.add(async () => {
    const url = getContractCodeUrl(chainId, contractAddress);
    const response = await axios.get(url);
    return { chainId, response: response.data };
  });
};

const parseSourceCode = (sourceCode: string, challenge: any) => {
  try {
    // Option 3. A valid JSON
    const parsedJson = JSON.parse(sourceCode);
    return parsedJson?.[`${challenge.contractName}`]?.content;
  } catch (e) {
    if (sourceCode.slice(0, 1) === "{") {
      // Option 2. An almost valid JSON
      // Remove the initial and final { }
      const validJson = JSON.parse(sourceCode.substring(1).slice(0, -1));
      return (
        validJson?.sources[`contracts/${challenge.contractName}`]?.content ??
        validJson?.sources[`./contracts/${challenge.contractName}`]?.content
      );
    } else {
      // Option 1. A string
      return sourceCode;
    }
  }
};

/**
 * 1. Fetch the contract source code from Etherscan across all supported chains
 * 2. Save the contract source code into the appropriate challenge directory
 */
export const downloadContract = async (
  config: SubmissionConfig
): Promise<{ chainId: string, network: string }> => {
  const { challenge, contractAddress } = config;
  console.log(`📡 Downloading ${contractAddress} from all supported chains...`);

  let sourceCodeParsed: string | undefined;
  let successfulChain: string | undefined;

  try {
    // Query all supported chains
    const chainPromises = SUPPORTED_CHAINS.map((chain: SupportedChain) => 
      fetchContractFromChain(chain.chainid, contractAddress)
    );

    // Wait for all requests to complete
    const results = await Promise.allSettled(chainPromises);

    // Process results to find the first successful response
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        const { chainId, response } = result.value;
        
        // The Etherscan API returns OK / NOTOK
        if (response.message === "OK" && response.result?.[0]?.SourceCode) {
          const sourceCode = response.result[0].SourceCode;
          
          try {
            const parsed = parseSourceCode(sourceCode, challenge);
            if (parsed) {
              sourceCodeParsed = parsed;
              successfulChain = chainId;
              const chainName = SUPPORTED_CHAINS.find((c: SupportedChain) => c.chainid === chainId)?.name || chainId;
              console.log(`✅ Contract found and verified on ${chainName} (Chain ID: ${chainId})`);
              break;
            }
          } catch (parseError) {
            console.log(`⚠️ Could not parse source code from chain ${chainId}:`, parseError);
            continue;
          }
        } 
      } else {
        console.log(`❌ Request failed for chain ${SUPPORTED_CHAINS[i].chainid}:`, result.reason?.message || 'Unknown error');
      }
    }

    if (!sourceCodeParsed) {
      throw new Error(
        `Contract Source Code not found on any supported chain. Is the contract verified on any of the supported networks? Contract address: ${contractAddress}`
      );
    }

    if (!sourceCodeParsed.includes(challenge.contractName.replace('.sol', ''))) {
      console.log(`⚠️ Warning: Contract name '${challenge.contractName}' not found in source code. This might be expected for some contract structures.`);
    }

    const path = `${__dirname}/../challenges/${challenge.name}`;
    const contractPath = `${path}/packages/foundry/contracts/download-${contractAddress}.sol`;
    fs.writeFileSync(contractPath, sourceCodeParsed);
    
    const network = SUPPORTED_CHAINS.find((c: SupportedChain) => c.chainid === successfulChain)?.network || successfulChain!;
    console.log(`📝 Contract saved at ${contractPath} (source: ${network})`);
    return { chainId: successfulChain!, network };
  } catch (e) {
    console.error('Error downloading contract:', e);
    throw e;
  }
};

/**
 * Run the test from within the challenge repo against the downloaded contract
 * Delete the downloaded contract after testing so we don't have the prod server stacking up files with each submission
 */
export const testChallengeSubmission = async (config: SubmissionConfig) => {
  const { challenge, contractAddress } = config;

  try {
    console.log("🧪 Testing challenge submission...");
    const path = `${__dirname}/../challenges/${challenge.name}`;
    const contractName = challenge.contractName.replace(".sol", "");
    const contractPath = `download-${contractAddress}.sol:${contractName}`;
    const testCommand = `cd ${path} && CONTRACT_PATH="${contractPath}" yarn foundry:test --gas-report`;
    const { stdout, stderr } = await execute(testCommand);
    const removeContractCommand = `rm -f ${path}/packages/foundry/contracts/download-${contractAddress}.sol`;
    execute(removeContractCommand);
    return { stdout, stderr };
  } catch (e) {
    console.error("Something went wrong", JSON.stringify(e), "\n");
    throw e;
  }
};
