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

2. Set up your environment variables (and optionally, a local Firebase instance):
   Make a copy of the `.env.example` file and name it `.env.local` and fill in the required environment variables.

    You will need to set up an [Etherscan API Key](https://etherscan.io/apis).

    Start the firebase emulators. You will need to install the [firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) `npm i -g firebase-tools` and run the following command:

    ```bash
    # You might need to add a real "--project <projectName>" (run firebase projects:list)
    firebase emulators:start
    ```

3. Seed data in your local Firebase instance:

    Run the following command:

    ```bash
    yarn seed
    ```

    You should now have this file `packages/firebase/seed.json` that you can edit and reseed if you have need. To overwrite the existing data use `yarn seed --reset`.


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
    localhost:3000/0/sepolia/0xC7A49f9D6A7AcD951f604e7838C51B451b5244f2
    ```

## Live Firebase Firestore Instance (For Production Environments)

To seed data into an empty _*live*_ firestore instance you can use `yarn seed --force-prod`. If there is data in the live instance, it will not seed it again to bypass it use `yarn seed --reset --force-prod`