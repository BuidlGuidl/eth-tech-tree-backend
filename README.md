# ETH Tech Tree Backend

This express server application is used to grade submitted challenges from the ETH Tech Tree

## Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Getting Started

1. Clone this repo & install dependencies

    ```
    git clone https://github.com/BuidlGuidl/eth-tech-tree-backend.git
    cd eth-tech-tree-backend
    yarn install
    ```

2. Set up your environment variables:
   Make a copy of the `.env.example` file and name it `.env.local` and fill in the required environment variables.

    Set up an [Etherscan API Key](https://etherscan.io/apis).
    Also set up the `MONGODB_URI` pointing to a local or [hosted](https://www.mongodb.com/products/platform/atlas-database) MongoDB instance.
    

3. Seed the database:

    `seed.example.json` will be used to seed the data. Modify it as needed if you are adding or modifying collections.
    Run the following command (notice how we add the environment variable then run `yarn seed`):

    ```bash
    MONGODB_URI=mongodb://localhost:27017/your-db-name yarn seed
    ```

    To overwrite the existing data use `yarn seed --reset`.


4. Install challenge folders where tests will be executed

    ```bash
    yarn install:challenges
    ```

5. Start the server at `localhost:3000`

    ```bash
    yarn dev
    ```

6. Test a challenge submission for token wrapper weth at the following endpoint

    ```
    POST
    localhost:3000/submit
    ```
    With this body:
    ```
    {
    "challengeSlug": "token-wrapper-weth",
    "network": "sepolia",
    "contractAddress": "0xCa359ee2DF0CE120a9eDa850Aa743fC2b4F1ade9",
    "userAddress": "0x60583563D5879C2E59973E5718c7DE2147971807"
    }
    ```
    To test a failing contract use this as the contract address:
    ```
    0x4c45da107F95d8Ed27951EbDD4CF4CC56B47A83F
    ```