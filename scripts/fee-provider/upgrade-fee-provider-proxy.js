const { ethers, network, upgrades } = require('hardhat');
const { getForNetwork } = require('../utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { feeProviderProxy } = getForNetwork(network.name);

  const FeeProvider = await ethers.getContractFactory('FeeProvider');
  await upgrades.upgradeProxy(feeProviderProxy, FeeProvider, { deployer });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
