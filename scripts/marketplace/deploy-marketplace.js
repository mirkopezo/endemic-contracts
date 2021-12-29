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
      '0xcF96Ed58395d55d6bd0c470f7ed064741119cbC5',
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
