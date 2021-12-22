const { expect } = require('chai');
const { ethers, network, upgrades } = require('hardhat');
const BN = require('bignumber.js');
const {
  deployEndemicNFT,
  deployBid,
  deployEndemicMasterNFT,
  deployContractRegistry,
  deployFeeProvider,
} = require('./helpers/deploy');

describe('FeeProvider', function () {
  let masterNftContract, feeProviderContract, contractRegistryContract;

  let owner, user1, nftContract, saleContract;

  async function deploy(makerFee = 300, takerFee = 300, initialFee = 2200) {
    [owner, user1, nftContract, saleContract] = await ethers.getSigners();

    contractRegistryContract = await deployContractRegistry(owner);
    masterNftContract = await deployEndemicMasterNFT(owner);

    feeProviderContract = await deployFeeProvider(
      owner,
      masterNftContract.address,
      contractRegistryContract.address,
      makerFee,
      takerFee,
      initialFee
    );

    await contractRegistryContract.addSaleContract(saleContract.address);
  }

  describe('Maker fee', () => {
    beforeEach(deploy);

    it('should calculate correct fee for initial sale', async () => {
      const fee = await feeProviderContract.getMakerFee(
        owner.address,
        nftContract.address,
        1
      );

      expect(fee.toString()).to.equal('2200');
    });

    it('should calculate correct fee for secondary sale', async () => {
      await feeProviderContract
        .connect(saleContract)
        .onInitialSale(nftContract.address, 1);

      const fee = await feeProviderContract.getMakerFee(
        owner.address,
        nftContract.address,
        1
      );

      expect(fee.toString()).to.equal('300');
    });

    it('should calculate correct fee when maker is master nft owner', async () => {
      await masterNftContract.mintNFT(owner.address);

      const initialFee = await feeProviderContract.getMakerFee(
        owner.address,
        nftContract.address,
        1
      );

      expect(initialFee.toString()).to.equal('0');

      await feeProviderContract
        .connect(saleContract)
        .onInitialSale(nftContract.address, 1);

      const secondaryFee = await feeProviderContract.getMakerFee(
        owner.address,
        nftContract.address,
        1
      );

      expect(secondaryFee.toString()).to.equal('0');
    });
  });

  describe('Taker fee', () => {
    beforeEach(deploy);

    it('should calculate correct fee', async () => {
      const fee = await feeProviderContract.getTakerFee(owner.address);
      expect(fee.toString()).to.equal('300');
    });

    it('should calculate correct fee when maker is master nft owner', async () => {
      await masterNftContract.mintNFT(owner.address);

      const fee = await feeProviderContract.getTakerFee(owner.address);
      expect(fee.toString()).to.equal('0');
    });
  });

  describe('Update fee', () => {
    beforeEach(deploy);

    it('should fail to update fee if not owner', async function () {
      await expect(
        feeProviderContract.connect(user1).updateFee(500, 600, 2000, 500)
      ).to.be.reverted;
    });

    it('should update fee', async function () {
      await feeProviderContract.updateFee(500, 600, 2000, 550);

      expect((await feeProviderContract.getMasterNftCut()).toString()).to.equal(
        '550'
      );

      expect(
        (await feeProviderContract.getTakerFee(owner.address)).toString()
      ).to.equal('600');

      expect(
        (await feeProviderContract.getTakerFee(owner.address)).toString()
      ).to.equal('600');

      expect(
        (
          await feeProviderContract.getMakerFee(
            owner.address,
            nftContract.address,
            1
          )
        ).toString()
      ).to.equal('2000');

      await feeProviderContract
        .connect(saleContract)
        .onInitialSale(nftContract.address, 1);

      expect(
        (
          await feeProviderContract.getMakerFee(
            owner.address,
            nftContract.address,
            1
          )
        ).toString()
      ).to.equal('500');
    });
  });

  describe('On initial sale', () => {
    beforeEach(deploy);

    it('should fail if caller is not sale contract', async function () {
      await expect(
        feeProviderContract.connect(user1).onInitialSale(nftContract.address, 1)
      ).to.be.revertedWith('Invalid caller');
    });
  });
});
