# Contracts (Foundry MVP)

## Contracts

- `MockUSDC.sol`: local testing collateral token (6 decimals)
- `PredictionMarketFactory.sol`: creates markets and tracks addresses
- `PredictionMarket.sol`: binary market (buy YES/NO, resolve, claim)

## Setup

```bash
forge install OpenZeppelin/openzeppelin-contracts@v5.4.0
forge install foundry-rs/forge-std@v1.9.6
```

## Commands

```bash
npm run build
npm test
npm run test:fuzz
npm run test:invariant
```

## Deploy local

Run a local node first:

```bash
anvil
```

Then deploy with env vars:

```bash
export PRIVATE_KEY=...
export CREATOR_ADDRESS=0x...
export ORACLE_ADDRESS=0x...
npm run deploy:local
```

## Export ABI to backend

```bash
npm run build
npm run export:abi
```
