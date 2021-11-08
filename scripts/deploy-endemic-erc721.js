const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying Endemic with the account:', deployer.address);

  const Endemic = await ethers.getContractFactory('Endemic');
  const endemicProxy = await upgrades.deployProxy(
    Endemic,
    ['ipfs://', process.env.DEFAULT_SIGNER],
    {
      deployer,
      initializer: '__Endemic_init',
    }
  );
  await endemicProxy.deployed();

  console.log('Endemic deployed to:', endemicProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
