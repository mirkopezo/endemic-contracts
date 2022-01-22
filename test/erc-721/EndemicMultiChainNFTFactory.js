const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

const { deployMarketplaceWithDeps } = require('../helpers/deploy');

describe('EndemicMultiChainNFTFactory', function () {
  let factoryContract1 = null;
  let factoryContract2 = null;
  let lzEndpointMock = null;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const { marketplace: marketplace1 } = await deployMarketplaceWithDeps(
      owner
    );
    const { marketplace: marketplace2 } = await deployMarketplaceWithDeps(
      owner
    );

    const EndemicMultiChainNFT = await ethers.getContractFactory(
      'EndemicMultiChainNFT'
    );

    /* --- Beacon contract on first chain --- */
    const beacon1 = await upgrades.deployBeacon(EndemicMultiChainNFT);
    await beacon1.deployed();
    /* --- Beacon contract on second chain --- */
    const beacon2 = await upgrades.deployBeacon(EndemicMultiChainNFT);
    await beacon2.deployed();

    const EndemicMultiChainNFTFactory = await ethers.getContractFactory(
      'EndemicMultiChainNFTFactory'
    );

    /* --- Deploy LayerZero Endpoint Mock Contract - for testing it will be same
    address for both chains. In reality it will be different contract address
    for every chain. --- */
    const LZEndpointMock = await ethers.getContractFactory('LZEndpointMock');
    lzEndpointMock = await LZEndpointMock.deploy();
    await lzEndpointMock.deployed();

    /* --- Factory contract on first chain --- */
    factoryContract1 = await EndemicMultiChainNFTFactory.deploy(
      beacon1.address,
      marketplace1.address,
      lzEndpointMock.address
    );
    await factoryContract1.deployed();

    /* --- Factory contract on second chain --- */
    factoryContract2 = await EndemicMultiChainNFTFactory.deploy(
      beacon2.address,
      marketplace2.address,
      lzEndpointMock.address
    );
    await factoryContract2.deployed();
  });

  describe('createMultiChainTokenOnBothChains() function', function () {
    it('should create contract correctly on both chains', async function () {
      await factoryContract1.grantRole(
        await factoryContract1.MINTER_ROLE(),
        user1.address
      );

      const tx1 = await factoryContract1
        .connect(user1)
        .createMultiChainTokenOnBothChains(
          // chainId - in this test its irrelevant
          555,
          factoryContract2.address,
          {
            name: 'Lazy #1',
            symbol: 'LZ',
            category: 'Art',
            baseURI: 'ipfs://',
          },
          // fee for using LayerZero
          { value: 50000000 }
        );

      const receipt = await tx1.wait();
      const eventData = receipt.events.find(
        ({ event }) => event === 'MultiChainNFTCreationInitiated'
      );
      const [newAddress, chainId, contractOwner, name, symbol, category] =
        eventData.args;

      /* --- Tests on first chain --- */

      expect(newAddress).to.be.properAddress;
      expect(chainId).to.equal(555);
      expect(contractOwner).to.equal(user1.address);
      expect(name).to.equal('Lazy #1');
      expect(symbol).to.equal('LZ');
      expect(category).to.equal('Art');

      const EndemicMultiChainNFT = await ethers.getContractFactory(
        'EndemicMultiChainNFT'
      );
      const contract1 = EndemicMultiChainNFT.attach(newAddress);

      expect(await contract1.name()).to.equal('Lazy #1');
      expect(await contract1.symbol()).to.equal('LZ');
      expect(await contract1.owner()).to.equal(user1.address);

      /* --- Tests on second chain --- */

      // Get all created contracts by user1 on second chain.
      const allTokens = await factoryContract2.connect(user1).getMyTokens();
      const tokenContractAddr = allTokens[0];

      expect(tokenContractAddr).to.be.properAddress;

      const contract2 = EndemicMultiChainNFT.attach(tokenContractAddr);

      expect(await contract2.name()).to.equal('Lazy #1');
      expect(await contract2.symbol()).to.equal('LZ');
      expect(await contract2.owner()).to.equal(user1.address);
    });
  });

  describe('after creating erc721 contracts on both chains', function () {
    let contract1, contract2;

    beforeEach(async function () {
      await factoryContract1.grantRole(
        await factoryContract1.MINTER_ROLE(),
        user1.address
      );

      const tx1 = await factoryContract1
        .connect(user1)
        .createMultiChainTokenOnBothChains(
          // chainId - in this tests its irrelevant
          555,
          factoryContract2.address,
          {
            name: 'Lazy #1',
            symbol: 'LZ',
            category: 'Art',
            baseURI: 'ipfs://',
          },
          // fee for using LayerZero
          { value: 50000000 }
        );

      const receipt = await tx1.wait();
      const eventData = receipt.events.find(
        ({ event }) => event === 'MultiChainNFTCreationInitiated'
      );
      const [newAddress, ...rest] =
        eventData.args;

      const EndemicMultiChainNFT = await ethers.getContractFactory(
        'EndemicMultiChainNFT'
      );
      contract1 = EndemicMultiChainNFT.attach(newAddress);

      // Get all created contracts by user1 on second chain.
      const allTokens = await factoryContract2.connect(user1).getMyTokens();
      const tokenContractAddr = allTokens[0];

      contract2 = EndemicMultiChainNFT.attach(tokenContractAddr);
    });

    it('should mint nft correctly if approved', async function () {
      const tx = await contract1
        .connect(user1)
        .mint(
          user1.address,
          user1.address,
          'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
        );
      await tx.wait();

      expect(await contract1.tokenURI(1)).to.equal(
        'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
    });

    it('should transfer nft correctly to another chain if approved', async function () {
      const tx = await contract1
        .connect(user1)
        .mint(
          user1.address,
          user1.address,
          'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
        );
      await tx.wait();

      const tx2 = await contract1
        .connect(user1)
        .setDestinationContractAddress(contract2.address);
      await tx2.wait();

      expect(await contract1.totalSupply()).to.equal(1);

      expect(await contract2.totalSupply()).to.equal(0);

      const tx3 = await contract1
        .connect(user1)
        .transferNftToOtherChain(555, contract2.address, 1, {
          value: 50000000,
        });
      await tx3.wait();

      expect(await contract1.totalSupply()).to.equal(0);

      expect(await contract2.totalSupply()).to.equal(1);
      expect(await contract2.tokenURI(1)).to.equal(
        'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
      expect(await contract2.ownerOf(1)).to.equal(user1.address);
    });

    it('should not transfer nft if not approved', async function () {
      const tx = await contract1
        .connect(user1)
        .mint(
          user1.address,
          user1.address,
          'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
        );
      await tx.wait();

      const tx2 = await contract1
        .connect(user1)
        .setDestinationContractAddress(contract2.address);
      await tx2.wait();

      await expect(
        contract1
          .connect(user2)
          .transferNftToOtherChain(555, contract2.address, 1, {
            value: 50000000,
          })
      ).to.be.revertedWith('ERC721Burnable: caller is not owner nor approved');
    });
  });
});
