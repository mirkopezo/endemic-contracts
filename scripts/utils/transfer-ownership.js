const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Transfering ownership');

  const newOwner = '0xF15B146d0251dB2fA9a4170fFFd6d587e009694A';

  const addresses = {
    contractRegistryProxy: '0x1BE1744a1d718C1E42dA5BD1e79639Ae6DFbEb58',
    endemicMasterKeyProxy: '0x6D27C84EC245A7865718e1CDb7D1aE0EF4B6f08E',
    feeProviderProxy: '0xb00BB669eb0953144caE73cf4049F59B6d358203',
    endemicNftProxy: '0x599F825A6cBAdA1c8eB972F2ebb6780576d11B96',
    endemicCollection: '0x1F081B956f670D0fbf6d02b0439e802540bA1aBD',
    marketplaceProxy: '0xDd29A2E65c01B75d74A53a469bF90371697846BF',
    endemicNftBeacon: '0xaFf28326DB64f2f02a7788A047E525B047c0A525',
    endemicNftFactory: '0xa5572e8558b2CCf6Cb7f05f04f3803dc577966F1',
    bidProxy: '0x7CDdB0f2defc12205693454a6B6581702e3C7924',
  };

  console.log('Transfering contract registry ownership');
  const ContractRegistry = await ethers.getContractFactory('ContractRegistry');
  const contractRegistry = await ContractRegistry.attach(
    addresses.contractRegistryProxy
  );
  await contractRegistry.transferOwnership(newOwner);

  console.log('Transfering master keys ownership');
  const EndemicMasterNFT = await ethers.getContractFactory('EndemicMasterNFT');
  const endemicMasterNFT = await EndemicMasterNFT.attach(
    addresses.contractRegistryProxy
  );
  await endemicMasterNFT.transferOwnership(newOwner);

  console.log('Transfering fee provider ownership');
  const FeeProvider = await ethers.getContractFactory('FeeProvider');
  const feeProvider = await FeeProvider.attach(addresses.feeProviderProxy);
  await feeProvider.transferOwnership(newOwner);

  console.log('Transfering endemic nft ownership');
  const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
  const endemicNFT = await EndemicNFT.attach(addresses.endemicNftProxy);
  await endemicNFT.transferOwnership(newOwner);

  console.log('Transfering endemic collection ownership');
  const Endemic = await ethers.getContractFactory('Endemic');
  const endemic = await Endemic.attach(addresses.endemicCollection);
  await endemic.transferOwnership(newOwner);

  console.log('Transfering Marketplace ownership');
  const Marketplace = await ethers.getContractFactory('Marketplace');
  const marketplace = await Marketplace.attach(addresses.marketplaceProxy);
  await marketplace.transferOwnership(newOwner);

  console.log('Transfering nft beacon ownership');
  const EndemicNFTBeacon = await ethers.getContractFactory('EndemicNFTBeacon');
  const endemicNFTBeacon = await Endemic.attach(addresses.endemicNftBeacon);
  await endemicNFTBeacon.transferOwnership(newOwner);

  console.log('Transfering nft factory ownership');
  const EndemicNFTFactory = await ethers.getContractFactory(
    'EndemicNFTFactory'
  );
  const endemicNFTFactory = await Endemic.attach(addresses.endemicNftFactory);
  await endemicNFTFactory.transferOwnership(newOwner);

  console.log('Transfering bid ownership');
  const Bid = await ethers.getContractFactory('Bid');
  const bid = await Bid.attach(addresses.bidProxy);
  await bid.transferOwnership(newOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
