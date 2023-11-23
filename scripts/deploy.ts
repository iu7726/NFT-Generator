import { ethers } from "hardhat";

async function main() {
  const ERC721Logic = await ethers.getContractFactory("ERC721Logic");
  const erc721 = await ERC721Logic.deploy();

  await erc721.deployed();

  const Factory = await ethers.getContractFactory("Factory");
  const factory = await Factory.deploy(erc721.address);

  await factory.deployed();

  console.log("erc721 ", erc721.address);
  console.log("factory ", factory.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
