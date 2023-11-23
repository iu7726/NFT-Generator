# NFT Generator

![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.4-blue)
![Hardhat](https://img.shields.io/badge/Hardhat-black?logo=hardhat)

## Description
This NFT Generator project utilizes Solidity smart contracts to create and manage Non-Fungible Tokens (NFTs). It employs a beacon proxy pattern, allowing for upgradable NFT contracts. The project consists of two main contracts: BeaconContract and Factory. BeaconContract manages the logic contracts' versions, while Factory facilitates the creation of NFTs.

## Features
- Upgradable NFT contracts using UpgradeableBeacon.
- Creation of NFTs through a Factory contract.
- Supports private and public sales configurations for NFTs.
- Collateral functionality with existing NFTs.
- Owner-based control for upgrading NFT logic.

## Prerequisites
- Solidity ^0.8.4.
- OpenZeppelin contracts for upgradability, access control, and security.

## Usage

### Contract Interaction
- create and createPrivate: Methods in Factory for creating public and private NFT sales.
- upgradeNftLogic: Update the logic contract for future NFTs in Factory.

### Creating NFTs
- Use the create function with CreateInfo parameters to initiate a new NFT series.
- Use createPrivate for sales with specific access control.

## Hardhat

```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
