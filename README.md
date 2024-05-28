# ETH Tech Tree Challenge Grader

This express server application is used to grade submitted challenges from the ETH Tech Tree

## Getting Started

1. Download repo & install dependencies

```
git clone https://github.com/BuidlGuidl/eth-tech-tree-backend.git
cd eth-tech-tree-backend
yarn install
```

2. Copy `.env.example` to `.env` and put in your [Etherscan API Key](https://etherscan.io/apis).

3. Install challenge folders where tests will be executed

```
yarn install:challenges
```

4. Start the server at `localhost:3000`

```
yarn dev
```

5. Test a challenge submission for token wrapper weth at the following endpoint

```
localhost:3000/0/sepolia/0xC7A49f9D6A7AcD951f604e7838C51B451b5244f2
```
