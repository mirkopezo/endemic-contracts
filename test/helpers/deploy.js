const { ethers, upgrades } = require('hardhat');

const deployEndemicVesting = async (
  deployer,
  endemicTokenAddress,
  multisigAddress
) => {
  const EndemicVesting = await ethers.getContractFactory('EndemicVesting');

  const endemicVesting = await EndemicVesting.deploy(
    endemicTokenAddress,
    multisigAddress
  );

  await endemicVesting.deployed();
  return endemicVesting;
};

const deployEndemicTokenMining = async (endemicTokenAddress) => {
  const EndemicTokenMining = await ethers.getContractFactory(
    'EndemicTokenMining'
  );

  const endemicTokenMining = await EndemicTokenMining.deploy(
    endemicTokenAddress
  );
  await endemicTokenMining.deployed();
  return endemicTokenMining;
};

const deployEndemicToken = async () => {
  const EndemicToken = await ethers.getContractFactory('EndemicToken');

  const endemicToken = await EndemicToken.deploy();
  await endemicToken.deployed();
  return endemicToken;
};

const deployEndemic = async (deployer, defaultSigner) => {
  const Endemic = await ethers.getContractFactory('Endemic');

  const endemic = await upgrades.deployProxy(
    Endemic,
    ['ipfs://', defaultSigner.address],
    {
      deployer,
      initializer: '__Endemic_init',
    }
  );

  await endemic.deployed();
  return endemic;
};

const deployEndemicNFT = async (deployer) => {
  const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
  const nftContract = await upgrades.deployProxy(
    EndemicNFT,
    ['NftLazyTest', 'NFTL', 'ipfs://'],
    {
      deployer,
      initializer: '__EndemicNFT_init',
    }
  );
  await nftContract.deployed();
  return nftContract;
};

const deployEndemicERC1155 = async (deployer) => {
  const EndemicERC1155 = await ethers.getContractFactory('EndemicERC1155');
  const nftContract = await upgrades.deployProxy(
    EndemicERC1155,
    ['Endemic ERC 1155', 'ENDR', 'ipfs://'],
    {
      deployer,
      initializer: '__EndemicERC1155_init',
    }
  );
  await nftContract.deployed();
  return nftContract;
};

const deployMarketplace = async (
  deployer,
  feeProviderAddress,
  masterNFTAddress
) => {
  const Marketplace = await ethers.getContractFactory('Marketplace');
  const marketplaceContract = await upgrades.deployProxy(
    Marketplace,
    [
      feeProviderAddress,
      masterNFTAddress,
      '0x1d1C46273cEcC00F7503AB3E97A40a199bcd6b31',
    ],
    {
      deployer,
      initializer: '__Marketplace_init',
    }
  );
  await marketplaceContract.deployed();
  return marketplaceContract;
};

const deployMarketplaceWithDeps = async (
  deployer,
  makerFee = 0,
  takerFee = 0,
  initialFee = 0
) => {
  const contractRegistryContract = await deployContractRegistry(deployer);
  const masterNftContract = await deployEndemicMasterNFT(deployer);

  const feeProviderContract = await deployFeeProvider(
    deployer,
    masterNftContract.address,
    contractRegistryContract.address,
    makerFee,
    takerFee,
    initialFee
  );
  const marketplace = await deployMarketplace(
    deployer,
    feeProviderContract.address,
    masterNftContract.address
  );

  return {
    contractRegistryContract,
    masterNftContract,
    feeProviderContract,
    marketplace,
  };
};

const deployEndemicMasterNFT = async (deployer) => {
  const EndemicMasterNFT = await ethers.getContractFactory('EndemicMasterNFT');
  const masterNftContract = await upgrades.deployProxy(
    EndemicMasterNFT,
    ['https://tokenbase.com/master/'],
    {
      deployer,
      initializer: '__EndemicMasterNFT_init',
    }
  );
  await masterNftContract.deployed();
  return masterNftContract;
};

const deployBid = async (deployer, feeProviderAddress, masterNFTAddress) => {
  const Bid = await ethers.getContractFactory('Bid');
  const bidContract = await upgrades.deployProxy(
    Bid,
    [
      feeProviderAddress,
      masterNFTAddress,
      '0x1D96e9bA0a7c1fdCEB33F3f4C71ca9117FfbE5CD',
    ],
    {
      deployer,
      initializer: '__Bid_init',
    }
  );
  await bidContract.deployed();
  return bidContract;
};

const deployFeeProvider = async (
  deployer,
  masterNFTAddress,
  contractRegistryAddress,
  makerFee = 250, // 2.5% maker fee
  takerFee = 300, // 3% taker fee
  initialFee = 2200 // 22% initial sale fee
) => {
  const FeeProvider = await ethers.getContractFactory('FeeProvider');
  const feeProviderContract = await upgrades.deployProxy(
    FeeProvider,
    [
      initialFee,
      makerFee,
      takerFee,
      500,
      masterNFTAddress,
      contractRegistryAddress,
    ],
    {
      deployer,
      initializer: '__FeeProvider_init',
    }
  );

  await feeProviderContract.deployed();
  return feeProviderContract;
};

const deployContractRegistry = async (deployer) => {
  const ContractRegistry = await ethers.getContractFactory('ContractRegistry');
  const contractRegistryContracat = await upgrades.deployProxy(
    ContractRegistry,
    [],
    {
      deployer,
      initializer: '__ContractRegistry_init',
    }
  );

  await contractRegistryContracat.deployed();
  return contractRegistryContracat;
};

module.exports = {
  deployEndemicToken,
  deployEndemicNFT,
  deployMarketplaceWithDeps,
  deployEndemicMasterNFT,
  deployBid,
  deployEndemic,
  deployEndemicTokenMining,
  deployEndemicVesting,
  deployEndemicERC1155,
  deployFeeProvider,
  deployContractRegistry,
};
