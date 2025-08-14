# ETH Tech Tree Backend

This Express + TypeScript server grades submitted challenges from the ETH Tech Tree.

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20)](https://nodejs.org/en/download/)
- Yarn ([v3+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Getting Started

1. Clone this repo & install dependencies

    ```
    git clone https://github.com/BuidlGuidl/eth-tech-tree-backend.git
    cd eth-tech-tree-backend
    yarn install
    ```

2. Set up environment variables
   - Copy `.env.example` to `.env.local` (or `.env`) and fill in required values.
   - `ETHERSCAN_API_KEY`: Create a key in the Etherscan API dashboard.
   - `MONGODB_URI`: Local or [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) connection string.
    

3. Seed the database

    `seed.example.json` will be used to seed the data. Modify it as needed for local testing.
    Run the following command (prefix the env if not set in file):

    ```bash
    MONGODB_URI=mongodb://localhost:27017/your-db-name yarn seed
    ```

    To overwrite the existing data use `yarn seed --reset`.


4. Install challenge folders (test harnesses)

    ```bash
    yarn install:challenges
    ```

5. Start the server at `http://localhost:3000`

    ```bash
    yarn dev
    ```

6. Submit a challenge (example)

    ```
    POST
    localhost:3000/submit
    ```
    With this JSON body:
    ```
    {
        "challengeName": "token-wrapper-weth",
        "contractAddress": "0xCa359ee2DF0CE120a9eDa850Aa743fC2b4F1ade9",
        "userAddress": "0x60583563D5879C2E59973E5718c7DE2147971807"
    }
    ```
    To test a failing contract, use this address:
    ```
    0x4c45da107F95d8Ed27951EbDD4CF4CC56B47A83F

## API Overview

- GET `/` → Health text
- GET `/challenges` → List available challenges
- GET `/users` → List users (summary)
- GET `/user/:identifier` → Fetch user by address or ENS
- GET `/leaderboard` → Leaderboard data
- GET `/testnets` → Supported testnets configured on the server
- POST `/submit` → Submit a challenge run

### Submit payload

The server auto-detects the network using Etherscan API V2. Do not include a `network` field.

```json
{
  "challengeName": "token-wrapper-weth",
  "contractAddress": "0x...",
  "userAddress": "0x..."
}
```

On receipt, the server:
- Looks up contract source via Etherscan V2 across all configured testnets
- Applies global rate limiting (safe under 5 req/sec) across concurrent users
- Determines the correct network from a successful response
- Records the submission as `pending` with the discovered network
- Runs tests and updates the result (success/failed), storing any gas report and errors

## Etherscan API V2

- Base URL: `https://api.etherscan.io/v2/api`
- The server passes `chainid` for each configured testnet in `SUPPORTED_CHAINS` (see `packages/server/utils/config.ts`).
- No client-side network parameter is required.

## Development Notes

- Challenge setup uses `create-eth` under the hood. Output streams to console.
- Commands are executed with a streaming helper so you can watch progress live.

## Troubleshooting

- Ensure `ETHERSCAN_API_KEY` and `MONGODB_URI` are correctly set.
- If you see Etherscan rate limit errors, the server will back off and continue; try fewer concurrent submissions locally.
    ```
