import dotenv from "dotenv";
dotenv.config({ path: ['../../.env.local', '../../.env'] });

export const ALLOWED_NETWORKS = ["sepolia"];
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT || 3000;
export const SERVER_CERT = process.env.SERVER_CERT || "server.cert";
export const SERVER_KEY = process.env.SERVER_KEY || "server.key";
export const SKIP_TEST_EXISTS_CHECK = process.env.SKIP_TEST_EXISTS_CHECK || false;
export const EXTENSION_REPO = process.env.EXTENSION_REPO || "BuidlGuidl/eth-tech-tree-challenges";

export interface SupportedChain {
  name: string;
  network: string;
  chainid: string;
  blockexplorer: string;
  apiurl: string;
}

export const SUPPORTED_CHAINS: SupportedChain[] = [
    {
        name: "Sepolia",
        network: "sepolia",
        chainid: "11155111",
        blockexplorer: "https://sepolia.etherscan.io",
        apiurl: "https://api.etherscan.io/v2/api?chainid=11155111",
    },
    {
        name: "Base Sepolia",
        network: "baseSepolia",
        chainid: "84532",
        blockexplorer: "https://sepolia.basescan.org/",
        apiurl: "https://api.etherscan.io/v2/api?chainid=84532",
    },
    {
      name: "Arbitrum Sepolia",
      network: "arbitrumSepolia",
      chainid: "421614",
      blockexplorer: "https://sepolia.arbiscan.io/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=421614",
    },
    {
      name: "OP Sepolia",
      network: "opSepolia",
      chainid: "11155420",
      blockexplorer: "https://sepolia-optimism.etherscan.io/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=11155420",
    },
    {
      name: "Polygon zkEVM Cardona",
      network: "polygonZkEvmCardona",
      chainid: "2442",
      blockexplorer: "https://cardona-zkevm.polygonscan.com/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=2442",
    },
    {
      name: "Polygon Amoy",
      network: "polygonAmoy",
      chainid: "80002",
      blockexplorer: "https://amoy.polygonscan.com/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=80002",
    },
    {
      name: "Scroll Sepolia",
      network: "scrollSepolia",
      chainid: "534351",
      blockexplorer: "https://sepolia.scrollscan.com/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=534351",
    },
    {
      name: "Celo Alfajores",
      network: "celoAlfajores",
      chainid: "44787",
      blockexplorer: "https://alfajores.celoscan.io/",
      apiurl: "https://api.etherscan.io/v2/api?chainid=44787",
    },
  ];
