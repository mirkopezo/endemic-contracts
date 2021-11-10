const { ethers } = require('hardhat');
const { getForNetwork } = require('./utils/addresses');

async function main() {
  const [deployer] = await ethers.getSigners();
  const { endemicErc20 } = getForNetwork(network.name);

  console.log('Deploying EndemicVesting with the account:', deployer.address);

  const EndemicVesting = await ethers.getContractFactory('EndemicVesting');
  const endemicVesting = await EndemicVesting.deploy(
    endemicErc20,
    deployer.address
  );
  await endemicVesting.deployed();

  console.log('EndemicVesting deployed to:', endemicVesting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
