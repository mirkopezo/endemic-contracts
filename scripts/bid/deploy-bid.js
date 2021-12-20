const { ethers, upgrades, network } = require('hardhat');
const { getForNetwork } = require('../utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { endemicMasterKeyProxy, feeProviderProxy } = getForNetwork(
    network.name
  );

  console.log('Deploying Bid with the account:', deployer.address);

  const Bid = await ethers.getContractFactory('Bid');
  const bidProxy = await upgrades.deployProxy(
    Bid,
    [
      feeProviderProxy,
      endemicMasterKeyProxy,
      '0x1d1C46273cEcC00F7503AB3E97A40a199bcd6b31',
    ],
    {
      deployer,
      initializer: '__Bid_init',
    }
  );
  await bidProxy.deployed();

  console.log('Bid deployed to:', bidProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
