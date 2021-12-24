const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Transfering ownership');

  const newOwner = '0xf74d1189a1d8563b1c7837fac527ee063ce5c166';
  const address = '0x3c6efc5656610a792a9018cb1d57a918f3e9ef83';

  const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
  const nft = await EndemicNFT.attach(address);
  await nft.setApprovalForAll(
    '0xcF96Ed58395d55d6bd0c470f7ed064741119cbC5',
    true
  );
  const tx = await nft.transferOwnership(newOwner);
  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
