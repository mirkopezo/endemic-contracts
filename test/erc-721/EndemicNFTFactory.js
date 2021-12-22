const { expect, use } = require('chai');
const { ethers } = require('hardhat');
const Web3 = require('web3');
const {
  deployEndemicNFT,
  deployMarketplaceWithDeps,
  deployEndemicMasterNFT,
} = require('../helpers/deploy');

describe('EndemicNFTFactory', function () {
  let factoryContract = null;
  let EndemicLazyNFT = null;
  let owner, user, signer;

  beforeEach(async function () {
    [owner, user, signer] = await ethers.getSigners();

    const masterNftContract = await deployEndemicMasterNFT(owner);
    const { marketplace } = await deployMarketplaceWithDeps(owner);

    const implContract = await deployEndemicNFT(owner, signer.address);
    // beacon
    const EndemicNFTBeacon = await ethers.getContractFactory(
      'EndemicNFTBeacon'
    );
    const beacon = await EndemicNFTBeacon.deploy(implContract.address);
    await beacon.deployed();

    const EndemicNFTFactory = await ethers.getContractFactory(
      'EndemicNFTFactory'
    );

    factoryContract = await EndemicNFTFactory.deploy(
      beacon.address,
      marketplace.address
    );
    await factoryContract.deployed();
  });

  it('should have initial roles', async function () {
    const hasAdminRole = await factoryContract.hasRole(
      await factoryContract.DEFAULT_ADMIN_ROLE(),
      owner.address
    );

    const hasMinterRole = await factoryContract.hasRole(
      await factoryContract.MINTER_ROLE(),
      owner.address
    );
    expect(hasAdminRole).to.equal(true);
    expect(hasMinterRole).to.equal(true);
  });

  it('should be able to add new minters if admin', async () => {
    await factoryContract.grantRole(
      await factoryContract.MINTER_ROLE(),
      user.address
    );

    const hasMinterRole = await factoryContract.hasRole(
      await factoryContract.MINTER_ROLE(),
      user.address
    );
    expect(hasMinterRole).to.equal(true);
  });

  it('should not be able to add new minters if not admin', async () => {
    await expect(
      factoryContract
        .connect(user)
        .grantRole(await factoryContract.MINTER_ROLE(), user.address)
    ).to.be.reverted;
  });

  it('should deploy a new contract correctly if minter', async function () {
    const createToken = async (deployer) => {
      const tx = await factoryContract.connect(deployer).createToken({
        owner: owner.address,
        name: 'Lazy #1',
        symbol: 'LZ',
        category: 'Art',
        baseURI: 'ipfs://',
      });

      const receipt = await tx.wait();
      const eventData = receipt.events.find(
        ({ event }) => event === 'NFTContractCreated'
      );
      const [newAddress, contractOwner, name, symbol, category] =
        eventData.args;

      expect(newAddress).to.properAddress;
      expect(contractOwner).to.equal(owner.address);
      expect(name).to.equal('Lazy #1');
      expect(symbol).to.equal('LZ');
      expect(category).to.equal('Art');
    };

    // default minter
    await createToken(owner);

    //grant minter to other account
    await factoryContract.grantRole(
      await factoryContract.MINTER_ROLE(),
      user.address
    );

    await createToken(user);
  });

  it('should fail to deploy a new contract if not minter', async function () {
    await expect(
      factoryContract.connect(user).createToken({
        owner: owner.address,
        name: 'Lazy #1',
        symbol: 'LZ',
        category: 'Art',
        baseURI: 'ipfs://',
      })
    ).to.be.reverted;
  });
});
