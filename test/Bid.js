const { expect } = require('chai');
const { ethers, network, upgrades } = require('hardhat');
const BN = require('bignumber.js');
const {
  deployEndemicNFT,
  deployBid,
  deployEndemicMasterNFT,
} = require('./helpers/deploy');

describe('Bid', function () {
  let bidContract, masterNftContract, nftContract, nftContract2;
  let owner, user1, user2, user3;

  async function mint(id, recipient) {
    await nftContract
      .connect(owner)
      .mint(
        recipient,
        user1.address,
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
  }

  async function safeTransferWithBytes(sender, from, to, tokenId, data) {
    return await nftContract
      .connect(sender)
      ['safeTransferFrom(address,address,uint256,bytes)'](
        from,
        to,
        tokenId,
        data
      );
  }
  async function deploy(fee = 300) {
    [owner, user1, user2, user3, minter, signer, ...otherSigners] =
      await ethers.getSigners();

    masterNftContract = await deployEndemicMasterNFT(owner);
    bidContract = await deployBid(owner, fee, masterNftContract.address);

    nftContract = await deployEndemicNFT(owner);
    nftContract2 = await deployEndemicNFT(user1);

    await mint(1, user1.address);
  }

  describe('Initial State', () => {
    beforeEach(deploy);

    it('should start with owner set', async () => {
      const ownerAddr = await bidContract.owner();
      expect(ownerAddr).to.equal(owner.address);
    });
  });

  describe('Create bid', () => {
    beforeEach(deploy);

    it('should successfully create a bid', async () => {
      const placeBidTx = await bidContract.placeBid(
        nftContract.address,
        1,
        1000,
        {
          value: ethers.utils.parseUnits('0.5'),
        }
      );

      const activeBid = await bidContract.getBidByBidder(
        nftContract.address,
        1,
        owner.address
      );

      await expect(placeBidTx)
        .to.emit(bidContract, 'BidCreated')
        .withArgs(
          activeBid.bidId,
          nftContract.address,
          1,
          owner.address,
          activeBid.price,
          activeBid.expiresAt
        );

      expect(activeBid.bidIndex).to.equal(0);
      expect(activeBid.bidder).to.equal(owner.address);
      expect(activeBid.price).to.equal(ethers.utils.parseUnits('0.5'));
    });

    it('should fail to bid multiple times on same token', async () => {
      await bidContract.placeBid(nftContract.address, 1, 1000, {
        value: ethers.utils.parseUnits('0.5'),
      });

      await expect(
        bidContract.placeBid(nftContract.address, 1, 1000, {
          value: ethers.utils.parseUnits('0.6'),
        })
      ).to.be.revertedWith('Bid already exists');

      const activeBid = await bidContract.getBidByBidder(
        nftContract.address,
        1,
        owner.address
      );

      expect(activeBid.bidIndex).to.equal(0);
      expect(activeBid.bidder).to.equal(owner.address);
      expect(activeBid.price).to.equal(ethers.utils.parseUnits('0.5'));
    });

    it('should fail to create bid with no eth sent', async () => {
      await expect(
        bidContract.placeBid(nftContract.address, 1, 1000, {
          value: 0,
        })
      ).to.be.revertedWith('Invalid value sent');
    });

    it('should fail to bid on token owned by bidder', async () => {
      await expect(
        bidContract.connect(user1).placeBid(nftContract.address, 1, 1000, {
          value: ethers.utils.parseUnits('0.5'),
        })
      ).to.be.revertedWith("Token can't be burned or owned by the sender");
    });
  });

  describe('Cancel bid', () => {
    beforeEach(deploy);

    it('should be able to cancel bid', async () => {
      await bidContract.placeBid(nftContract.address, 1, 1000, {
        value: ethers.utils.parseUnits('0.5'),
      });

      const activeBid = await bidContract.getBidByBidder(
        nftContract.address,
        1,
        owner.address
      );

      const ownerBalance1 = await owner.getBalance();
      const cancelTx = await bidContract.cancelBid(nftContract.address, 1);

      await expect(cancelTx)
        .to.emit(bidContract, 'BidCancelled')
        .withArgs(activeBid.bidId, nftContract.address, 1, owner.address);

      const ownerBalance2 = await owner.getBalance();
      expect(ownerBalance2.sub(ownerBalance1)).to.be.closeTo(
        ethers.utils.parseUnits('0.5'),
        ethers.utils.parseUnits('0.001') //gas fees
      );

      await expect(
        bidContract.getBidByBidder(nftContract.address, 1, owner.address)
      ).to.be.revertedWith('Invalid index');
    });

    it('should not be able to cancel other bids', async () => {
      await bidContract.placeBid(nftContract.address, 1, 1000, {
        value: ethers.utils.parseUnits('0.5'),
      });

      await bidContract.connect(user2).placeBid(nftContract.address, 1, 1000, {
        value: ethers.utils.parseUnits('0.3'),
      });

      const ownerBalance1 = await owner.getBalance();
      await bidContract.cancelBid(nftContract.address, 1);

      const ownerBalance2 = await owner.getBalance();
      expect(ownerBalance2.sub(ownerBalance1)).to.be.closeTo(
        ethers.utils.parseUnits('0.5'),
        ethers.utils.parseUnits('0.001') //gas fees
      );

      await expect(
        bidContract.getBidByBidder(nftContract.address, 1, owner.address)
      ).to.be.revertedWith('Bidder has not an active bid for this token');

      const activeBid = await bidContract.getBidByBidder(
        nftContract.address,
        1,
        user2.address
      );

      expect(activeBid.bidIndex).to.equal(0);
    });
  });

  describe('Accept bid', () => {
    beforeEach(deploy);

    it('should be able to accept bid', async () => {
      await bidContract.placeBid(nftContract.address, 1, 1000000, {
        value: ethers.utils.parseUnits('0.5'),
      });

      const user1Balance1 = await user1.getBalance();

      const bidId = (
        await bidContract.getBidByToken(nftContract.address, 1, 0)
      )[0];

      const transferTx = await safeTransferWithBytes(
        user1,
        user1.address,
        bidContract.address,
        1,
        bidId
      );

      await expect(transferTx)
        .to.emit(bidContract, 'BidAccepted')
        .withArgs(
          bidId,
          nftContract.address,
          1,
          owner.address,
          user1.address,
          ethers.utils.parseUnits('0.5')
        );

      const user1Balance2 = await user1.getBalance();

      expect(user1Balance2.sub(user1Balance1)).to.be.closeTo(
        ethers.utils.parseUnits('0.485'),
        ethers.utils.parseUnits('0.001') //gas
      );

      expect(await nftContract.ownerOf(1)).to.equal(owner.address);

      const feeBalance = await nftContract.provider.getBalance(
        '0x1D96e9bA0a7c1fdCEB33F3f4C71ca9117FfbE5CD'
      );

      expect(feeBalance).to.equal(ethers.utils.parseUnits('0.015'));
    });

    it('should not charge fee if seller is owner of master nft', async () => {
      await masterNftContract.mintNFT(user1.address);

      await bidContract.placeBid(nftContract.address, 1, 1000000, {
        value: ethers.utils.parseUnits('0.5'),
      });

      const user1Balance1 = await user1.getBalance();

      const bidId = (
        await bidContract.getBidByToken(nftContract.address, 1, 0)
      )[0];

      await safeTransferWithBytes(
        user1,
        user1.address,
        bidContract.address,
        1,
        bidId
      );

      const user1Balance2 = await user1.getBalance();

      expect(user1Balance2.sub(user1Balance1)).to.be.closeTo(
        ethers.utils.parseUnits('0.5'),
        ethers.utils.parseUnits('0.001') //gas
      );

      expect(await nftContract.ownerOf(1)).to.equal(owner.address);
    });
  });
});
