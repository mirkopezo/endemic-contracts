const { ethers, network } = require('hardhat');
const { getForNetwork } = require('../utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { endemicNftBeacon, marketplaceProxy } = getForNetwork(network.name);

  console.log(
    'Deploying EndemicNFTFactory with the account:',
    deployer.address
  );
  const EndemicNFTFactory = await ethers.getContractFactory(
    'EndemicNFTFactory'
  );
  const endemicNFTFactory = await EndemicNFTFactory.deploy(
    endemicNftBeacon,
    marketplaceProxy
  );
  await endemicNFTFactory.deployed();
  console.log('Deployed EndemicNFTFactory to:', endemicNFTFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
