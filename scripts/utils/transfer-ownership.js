const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Transfering ownership');

  const newOwner = '0xcF96Ed58395d55d6bd0c470f7ed064741119cbC5';

  const addresses = {
    contractRegistryProxy: '0xB2d6c6D02f9b6C68c8Aa5fdb455f0feB008D3107',
    endemicMasterKeyProxy: '0x97cb197f862173a0f4c0B9Fda3272b56464578cc',
    feeProviderProxy: '0x3853676279Ada77826afDEdE6a815D5250A1867A',
    endemicNftProxy: '0xCd75e540157E04b0a7f1E347d21dED2FF748AD0f',
    endemicCollection: '0x329b61bF16aDd14863c1C154614888F14303169c',
    endemicNftBeacon: '0xAfAF30cB1215e344088296e058c7694bAeBAe1E9',
    marketplaceProxy: '0x5f89c1bBbCAc22fc15aC3074c0CfeC6bcF117FE5',
    endemicNftFactory: '0x7e4fD7d4bb0e31A14B76a396F840b6FE08A51da3',
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

  // console.log('Transfering bid ownership');
  // const Bid = await ethers.getContractFactory('Bid');
  // const bid = await Bid.attach(addresses.bidProxy);
  // await bid.transferOwnership(newOwner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
