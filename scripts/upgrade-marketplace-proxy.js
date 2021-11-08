const { ethers, network, upgrades } = require('hardhat');
const { getForNetwork } = require('./utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { marketplaceProxy } = getForNetwork(network.name);

  const Marketplace = await ethers.getContractFactory('Marketplace');
  await upgrades.upgradeProxy(marketplaceProxy, Marketplace, { deployer });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
