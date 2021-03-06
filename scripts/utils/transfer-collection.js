const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Transfering ownership');

  const newOwner = '0xcF96Ed58395d55d6bd0c470f7ed064741119cbC5';
  const address = '0xa341fc4962801aa57b66c89acbeba91afc77a40c';

  const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
  const nft = await EndemicNFT.attach(address);
  const tx1 = await nft.setDefaultApproval(
    '0xcF96Ed58395d55d6bd0c470f7ed064741119cbC5',
    true
  );

  await tx1.wait();

  const tx = await nft.transferOwnership(newOwner);
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
