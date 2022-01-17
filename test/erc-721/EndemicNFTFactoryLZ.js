const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

const {
  deployEndemicNFT,
  deployMarketplaceWithDeps,
} = require('../helpers/deploy');

describe('EndemicNFTFactory', function () {
  let factoryContract1 = null;
  let factoryContract2 = null;
  let lzEndpointMock = null;
  let owner, user, signer;
  let marketplace1Addr, marketplace2Addr;

  beforeEach(async function () {
    [owner, user, signer] = await ethers.getSigners();

    const { marketplace: marketplace1 } = await deployMarketplaceWithDeps(
      owner
    );
    const { marketplace: marketplace2 } = await deployMarketplaceWithDeps(
      owner
    );

    marketplace1Addr = marketplace1.address;
    marketplace2Addr = marketplace2.address;

    const EndemicNFT = await ethers.getContractFactory('EndemicNFT');

    /* --- Beacon contract on first chain --- */
    const beacon1 = await upgrades.deployBeacon(EndemicNFT);
    await beacon1.deployed();
    /* --- Beacon contract on second chain --- */
    const beacon2 = await upgrades.deployBeacon(EndemicNFT);
    await beacon2.deployed();

    const EndemicNFTFactory = await ethers.getContractFactory(
      'EndemicNFTFactory'
    );

    /* --- Deploy LayerZero Endpoint Mock Contract - for testing it will be same
    address for both chains --- */
    const LZEndpointMock = await ethers.getContractFactory('LZEndpointMock');
    lzEndpointMock = await LZEndpointMock.deploy();
    await lzEndpointMock.deployed();

    /* --- Factory contract on first chain --- */
    factoryContract1 = await EndemicNFTFactory.deploy(
      beacon1.address,
      marketplace1.address,
      lzEndpointMock.address
    );
    await factoryContract1.deployed();

    /* --- Factory contract on second chain --- */
    factoryContract2 = await EndemicNFTFactory.deploy(
      beacon2.address,
      marketplace2.address,
      lzEndpointMock.address
    );
    await factoryContract2.deployed();
  });

  it('should deploy contract correctly on other chain if minter', async function () {
    await factoryContract1.grantRole(
      await factoryContract1.MINTER_ROLE(),
      user.address
    );

    const tx = await factoryContract1.connect(user).createTokenOnOtherChain(
      555, // chainId - in this test its irrelevant
      factoryContract2.address,
      {
        name: 'Lazy #1',
        symbol: 'LZ',
        category: 'Art',
        baseURI: 'ipfs://',
      },
      { value: 50000000 }
    );

    const receipt = await tx.wait();
    const eventData = receipt.events.find(
      ({ event }) => event === 'NFTCreationInitiated'
    );
    const [chainId, contractOwner, name, symbol, category] = eventData.args;

    expect(chainId).to.equal(555);
    expect(contractOwner).to.equal(user.address);
    expect(name).to.equal('Lazy #1');
    expect(symbol).to.equal('LZ');
    expect(category).to.equal('Art');

    const allTokens = await factoryContract2.connect(user).getMyTokens();
    const tokenContract = allTokens[0];

    expect(tokenContract).to.properAddress;

    const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
    const token = EndemicNFT.attach(tokenContract);

    expect(await token.name()).to.equal('Lazy #1');
    expect(await token.symbol()).to.equal('LZ');
    expect(await token.owner()).to.equal(user.address);
  });

  it('owner of contract can mint tokens after contract is created', async function () {
    await factoryContract1.grantRole(
      await factoryContract1.MINTER_ROLE(),
      user.address
    );

    const tx = await factoryContract1.connect(user).createTokenOnOtherChain(
      555, // chainId - in this test its irrelevant
      factoryContract2.address,
      {
        name: 'Lazy #1',
        symbol: 'LZ',
        category: 'Art',
        baseURI: 'ipfs://',
      },
      { value: 50000000 }
    );
    await tx.wait();

    const allTokens = await factoryContract2.connect(user).getMyTokens();
    const tokenContract = allTokens[0];

    const EndemicNFT = await ethers.getContractFactory('EndemicNFT');
    const contract = EndemicNFT.attach(tokenContract);
    const tx2 = await contract
      .connect(user)
      .mint(
        user.address,
        user.address,
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
    await tx2.wait();

    expect(await contract.tokenURI(1)).to.equal(
      'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    );
    expect(await contract.ownerOf(1)).to.equal(user.address);
    expect(
      await contract.isApprovedForAll(user.address, marketplace2Addr)
    ).to.equal(true);
  });
});
