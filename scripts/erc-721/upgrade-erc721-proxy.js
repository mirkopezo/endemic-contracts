const { ethers, network, upgrades } = require('hardhat');
const { getForNetwork } = require('../utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { endemicNftProxy, endemicMasterKeyProxy } = getForNetwork(
    network.name
  );

  const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
  const EndemicMasterNFT = await ethers.getContractFactory('EndemicMasterNFT');

  await upgrades.upgradeProxy(endemicNftProxy, EndemicNFT, { deployer });
  await upgrades.upgradeProxy(endemicMasterKeyProxy, EndemicMasterNFT, {
    deployer,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
