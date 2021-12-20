const { ethers, upgrades, network } = require('hardhat');
const { getForNetwork } = require('../utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { endemicMasterKeyProxy, feeProviderProxy } = getForNetwork(
    network.name
  );

  console.log('Deploying Marketplace with the account:', deployer.address);

  const Marketplace = await ethers.getContractFactory('Marketplace');
  const marketPlaceProxy = await upgrades.deployProxy(
    Marketplace,
    [
      feeProviderProxy,
      endemicMasterKeyProxy,
      '0x1d1C46273cEcC00F7503AB3E97A40a199bcd6b31',
    ],
    {
      deployer,
      initializer: '__Marketplace_init',
    }
  );
  await marketPlaceProxy.deployed();

  console.log('Marketplace deployed to:', marketPlaceProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
