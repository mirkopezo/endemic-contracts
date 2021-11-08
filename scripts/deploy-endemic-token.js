const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying EndemicToken with the account:', deployer.address);

  const EndemicToken = await ethers.getContractFactory('Endemic');
  const endemicToken = await EndemicToken.deploy();

  await endemicToken.deployed();

  console.log('EndeEndemicTokenmic deployed to:', endemicToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
