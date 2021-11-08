const { expect } = require('chai');
const { ethers, network, upgrades } = require('hardhat');
const BN = require('bignumber.js');
const {
  deployEndemicNFT,
  deployMarketplace,
  deployEndemicMasterNFT,
} = require('./helpers/deploy');

describe('Marketplace', function () {
  let marketplace, masterNftContract, nftContract, nftContract2;
  let owner, user1, user2, user3, minter, signer;
  const tokenId = 1;

  async function mint(id, recipient) {
    await nftContract
      .connect(owner)
      .mint(
        recipient,
        user1.address,
        'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
  }

  async function deploy(makerFee = 0, takerFee, initialFee = 0) {
    [owner, user1, user2, user3, minter, signer, ...otherSigners] =
      await ethers.getSigners();

    masterNftContract = await deployEndemicMasterNFT(owner);
    marketplace = await deployMarketplace(
      owner,
      masterNftContract.address,
      makerFee,
      takerFee,
      initialFee
    );
    nftContract = await deployEndemicNFT(owner);
    nftContract2 = await deployEndemicNFT(user1);

    await mint(tokenId, user1.address);
  }

  describe('Initial State', function () {
    beforeEach(deploy);

    it('should start with owner and NFT address set', async function () {
      const ownerAddr = await marketplace.owner();
      expect(ownerAddr).to.equal(owner.address);
    });
  });

  describe('Create auction', function () {
    beforeEach(async function () {
      await deploy();
    });

    it("should fail to create auction for NFT you don't own", async function () {
      await expect(
        marketplace
          .connect(user2)
          .createAuction(
            nftContract.address,
            tokenId,
            ethers.utils.parseUnits('0.1'),
            ethers.utils.parseUnits('0.1'),
            60
          )
      ).to.be.revertedWith('Seller is not owner of the asset');
    });

    it('should fail to create auction for invalid duration', async function () {
      await nftContract.connect(user1).approve(marketplace.address, tokenId);

      await expect(
        marketplace
          .connect(user1)
          .createAuction(
            nftContract.address,
            tokenId,
            ethers.utils.parseUnits('0.1'),
            ethers.utils.parseUnits('0.1'),
            new BN(99).pow(99)
          )
      ).to.be.reverted;

      await expect(
        marketplace
          .connect(user1)
          .createAuction(
            nftContract.address,
            tokenId,
            ethers.utils.parseUnits('0.1'),
            ethers.utils.parseUnits('0.1'),
            1
          )
      ).to.be.revertedWith('Auction too short');
    });

    it('should fail to create auction for nonexistant NFT', async function () {
      const noSuchTokenId = '22';
      await nftContract.connect(user1).approve(marketplace.address, tokenId);

      await expect(
        marketplace
          .connect(user1)
          .createAuction(
            nftContract.address,
            noSuchTokenId,
            ethers.utils.parseUnits('0.3'),
            ethers.utils.parseUnits('0.2'),
            60
          )
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('should fail to create auction without first approving auction contract', async function () {
      await expect(
        marketplace
          .connect(user1)
          .createAuction(
            nftContract.address,
            tokenId,
            ethers.utils.parseUnits('0.3'),
            ethers.utils.parseUnits('0.1'),
            60
          )
      ).to.be.revertedWith('Marketplace is not approved for the asset');
    });

    it('should be able to recreate auction', async function () {
      // Create the auction
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.1'),
          ethers.utils.parseUnits('0.1'),
          60
        );
      // Try to create the auction again

      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.2'),
          ethers.utils.parseUnits('0.2'),
          60
        );

      const auction1 = await marketplace.getAuction(
        nftContract.address,
        tokenId
      );

      expect(auction1.seller).to.equal(user1.address);
      expect(auction1.startingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.2')
      );
      expect(auction1.endingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.2')
      );
    });

    it('should be able to create auctions for multiple NFTs', async function () {
      const tokenId2 = 2;
      await mint(tokenId2, user1.address);

      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await nftContract.connect(user1).approve(marketplace.address, tokenId2);

      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.1'),
          ethers.utils.parseUnits('0.1'),
          60
        );

      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId2,
          ethers.utils.parseUnits('0.1'),
          ethers.utils.parseUnits('0.1'),
          120
        );

      const auction1 = await marketplace.getAuction(
        nftContract.address,
        tokenId
      );
      const auction2 = await marketplace.getAuction(
        nftContract.address,
        tokenId2
      );

      expect(auction1.seller).to.equal(user1.address);
      expect(auction1.startingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.1')
      );
      expect(auction1.endingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.1')
      );
      expect(auction1.duration.toString()).to.equal('60');

      expect(auction2.seller).to.equal(user1.address);
      expect(auction2.startingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.1')
      );
      expect(auction2.endingPrice.toString()).to.equal(
        ethers.utils.parseUnits('0.1')
      );
      expect(auction2.duration.toString()).to.equal('120');
    });
  });

  describe('Bidding', function () {
    beforeEach(async function () {
      await deploy();
      await nftContract.connect(user1).approve(marketplace.address, tokenId);

      const startingPrice = ethers.utils.parseUnits('0.1');
      const endingPrice = ethers.utils.parseUnits('0.1');
      const duration = 120;

      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          startingPrice,
          endingPrice,
          duration
        );
    });

    it('should fail to bid with insufficient value', async function () {
      await expect(
        marketplace.connect(user2).bid(nftContract.address, tokenId, {
          value: ethers.utils.parseUnits('0.01'),
        })
      ).to.be.revertedWith('Bid amount can not be lower then auction price');
    });

    it('should fail to bid if auction has been concluded', async function () {
      await marketplace
        .connect(user1)
        .cancelAuction(nftContract.address, tokenId);
      await expect(
        marketplace.connect(user2).bid(nftContract.address, tokenId, {
          value: ethers.utils.parseUnits('0.103'),
        })
      ).to.be.revertedWith('NFT is not on auction');
    });

    it('should be able to bid', async function () {
      const user1Bal1 = await user1.getBalance();

      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.103'),
      });

      // User1 should receive 100 wei, fee is zero

      const user1Bal2 = await user1.getBalance();
      const user1Diff = user1Bal2.sub(user1Bal1);
      expect(user1Diff.toString()).to.equal(ethers.utils.parseUnits('0.1'));

      // Bidder should own NFT
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user2.address);
    });

    it('should be able to bid at endingPrice if auction has passed duration', async function () {
      const user1Bal1 = await user1.getBalance();
      await network.provider.send('evm_increaseTime', [200]);

      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.103'),
      });

      // Owner should have received 100 wei
      const user1Bal2 = await user1.getBalance();
      const user1Diff = user1Bal2.sub(user1Bal1);
      expect(user1Diff.toString()).to.equal(ethers.utils.parseUnits('0.1'));
      // Bidder should own NFT
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user2.address);
    });

    it('should fail to bid after someone else has bid', async function () {
      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.103'),
      });
      await expect(
        marketplace.connect(user3).bid(nftContract.address, tokenId, {
          value: ethers.utils.parseUnits('0.103'),
        })
      ).to.be.revertedWith('NFT is not on auction');
    });

    it('should be able to bid in middle of auction', async function () {
      const user1Bal1 = await user1.getBalance();
      await network.provider.send('evm_increaseTime', [60]);
      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.103'),
      });
      // Seller should have received 150 wei
      const user1Bal2 = await user1.getBalance();
      const user1Diff = user1Bal2.sub(user1Bal1);
      expect(user1Diff.gt(149)).true;

      // Bidder should own NFT
      const token1Owner = await nftContract.ownerOf(tokenId);
      expect(token1Owner).to.equal(user2.address);
    });

    it('should trigger an event after successful bid', async function () {
      const auctionId = '1';

      const bid = marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.103'),
      });

      await expect(bid)
        .to.emit(marketplace, 'AuctionSuccessful')
        .withArgs(
          nftContract.address,
          tokenId.toString(),
          ethers.utils.parseUnits('0.1'),
          user2.address,
          auctionId
        );
    });
  });

  describe('Conclude auction', function () {
    beforeEach(async function () {
      await deploy();
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.1'),
          ethers.utils.parseUnits('0.1'),
          60
        );
    });

    it('should fail to conclude if NFT not on auction', async function () {
      await expect(
        marketplace.connect(user1).cancelAuction(nftContract.address, 12)
      ).to.be.revertedWith('Invalid auction');
    });

    it('should fail to conclude auction if not seller', async function () {
      await expect(
        marketplace.connect(user2).cancelAuction(nftContract.address, tokenId)
      ).to.be.revertedWith('Sender is not seller');
    });

    it('should be able to conclude auction', async function () {
      await network.provider.send('evm_increaseTime', [60]);
      await marketplace
        .connect(user1)
        .cancelAuction(nftContract.address, tokenId);
      // Seller should regain ownership of NFT
      const token1Owner = await nftContract.ownerOf(tokenId);
      expect(token1Owner).to.equal(user1.address);
    });

    it('should be able to conclude ongoing auction', async function () {
      await marketplace
        .connect(user1)
        .cancelAuction(nftContract.address, tokenId);
      const token1Owner = await nftContract.ownerOf(tokenId);
      expect(token1Owner).to.equal(user1.address);
    });

    it('should trigger event after canceling auction', async function () {
      const auctionId = '1';

      const cancleAuction = await marketplace
        .connect(user1)
        .cancelAuction(nftContract.address, tokenId);

      await expect(cancleAuction)
        .to.emit(marketplace, 'AuctionCancelled')
        .withArgs(nftContract.address, tokenId.toString(), auctionId);
    });
  });

  describe('Fee', function () {
    beforeEach(async function () {
      await deploy(250, 300, 2200);
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
    });

    it('should take cut on initial sale', async function () {
      // saves current contract and user1 balances and creates auction
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.2'),
          ethers.utils.parseUnits('0.2'),
          60
        );
      const user1Bal1 = await user1.getBalance();

      // buys NFT and calculates price diff on contract and user1 wallet
      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.206'),
      });
      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user1Bal2 = await user1.getBalance();
      const token2Owner = await nftContract.ownerOf(tokenId);
      const contractDiff = contractBal2.sub(contractBal1);

      // 22% of 0.2 + 3% fee
      expect(contractDiff.toString()).to.equal(ethers.utils.parseUnits('0.05'));

      const user1Diff = user1Bal2.sub(user1Bal1);
      // 0.2 minus 22% fee (220)
      expect(user1Diff.toString()).to.equal(ethers.utils.parseUnits('0.156'));
      expect(token2Owner).to.equal(user2.address);
    });

    it('should take cut on sequential sales', async function () {
      // Creates auction and bid it
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          60
        );

      // Buy with user 2
      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('1.03'),
      });

      // Auction again with user 2
      await nftContract.connect(user2).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user2)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.5'),
          ethers.utils.parseUnits('0.5'),
          60
        );

      // Grab current balance of seller and contract
      const user2Bal1 = await user2.getBalance();
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );

      // Buy with user 3
      await marketplace.connect(user3).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.515'),
      });

      //Grab updated balances of seller and contract
      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user2Bal2 = await user2.getBalance();

      const contractDiff = contractBal2.sub(contractBal1);
      const user2Diff = user2Bal2.sub(user2Bal1);

      // Checks if marketplace gets 2.5% maker fee + 3% taker fee
      // 2.5% of 0.5 + 0.015 taker fee
      expect(contractDiff).to.equal(ethers.utils.parseUnits('0.0275'));
      expect(user2Diff.toString()).to.equal(ethers.utils.parseUnits('0.4875'));

      // New owner
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user3.address);
    });

    it('should calculate seller fee correctly', async () => {
      await masterNftContract.connect(owner).mintNFT(user1.address);
      const masterNftFee = await marketplace.getMakerFee(
        user1.address,
        nftContract.address,
        1
      );
      expect(masterNftFee).to.equal(0);

      const initialFee = await marketplace.getMakerFee(
        user2.address,
        nftContract.address,
        2
      );
      expect(initialFee).to.equal(2200);

      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          60
        );

      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('1.03'),
      });

      // Initial sale completed, now fee should be 2.5%
      const marketplaceFee = await marketplace.getMakerFee(
        user2.address,
        nftContract.address,
        tokenId
      );
      expect(marketplaceFee).to.equal(250);
    });

    it('should handle fee change', async function () {
      // Update fees
      await marketplace.connect(owner).updateFee(500, 1000, 2000, 500); // 5% maker fee, 10% taker fee, 20% initial sale cut
      // Creates auction and bid it
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('2'),
          ethers.utils.parseUnits('2'),
          60
        );

      // Grab current marketpalce balance
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );

      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('2.2'),
      });

      // Contract now has 0.4 + 0.2 = 0.6 ETH
      // Create another auction
      await nftContract.connect(user2).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user2)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          60
        );

      // Grab current balance of seller
      const user2Bal1 = await user2.getBalance();

      // Bid it
      await marketplace.connect(user3).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('1.1'),
      });

      // Contract nw has 0.1 + 0.05
      //Grab updated balances of seller and contract
      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user2Bal2 = await user2.getBalance();

      const contractDiff = contractBal2.sub(contractBal1);
      const user2Diff = user2Bal2.sub(user2Bal1);

      // Checks if marketplace gets 5% maker and 10% taker
      expect(contractDiff.toString()).to.equal(ethers.utils.parseUnits('0.75'));
      expect(user2Diff.toString()).to.equal(ethers.utils.parseUnits('0.95'));

      // New owner
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user3.address);
    });

    it('should fail to update fee if not owner', async function () {
      await expect(marketplace.connect(user1).updateFee(500, 600, 2000, 500)).to
        .be.reverted;
    });

    it('should not charge maker fee if seller is owner of master NFT', async function () {
      // creates master NFT for user1, creates auction
      await masterNftContract.connect(owner).mintNFT(user1.address);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.2'),
          ethers.utils.parseUnits('0.2'),
          1000
        );

      // Grab balances
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user1Bal1 = await user1.getBalance();

      // Buy NFT
      await marketplace.connect(user3).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.206'),
      });

      // Grab updated balances
      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user1Bal2 = await user1.getBalance();

      // Only taker fee is taken (3%)
      const contractDiff = contractBal2.sub(contractBal1);
      expect(contractDiff.toString()).to.equal(
        ethers.utils.parseUnits('0.006')
      );

      // Seller got full amount
      const user1Diff = user1Bal2.sub(user1Bal1);
      expect(user1Diff.toString()).to.equal(ethers.utils.parseUnits('0.2'));
    });

    it('should not charge taker fee if buyer is owner of master NFT', async function () {
      await masterNftContract.connect(owner).mintNFT(user3.address);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('0.2'),
          ethers.utils.parseUnits('0.2'),
          1000
        );

      // Grab balances
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user1Bal1 = await user1.getBalance();

      // Buy NFT
      await marketplace.connect(user3).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('0.2'),
      });

      // Grab updated balances
      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );
      const user1Bal2 = await user1.getBalance();

      // Fee shouldn't be taken, diff is zero
      const contractDiff = contractBal2.sub(contractBal1);
      expect(contractDiff.toString()).to.equal(
        ethers.utils.parseUnits('0.044')
      );

      // Seller got full amount
      const user1Diff = user1Bal2.sub(user1Bal1);
      expect(user1Diff.toString()).to.equal(ethers.utils.parseUnits('0.156'));
    });
    it('should be able to withdraw funds to claim address', async function () {
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          1000
        );

      const user1Bal1 = await user1.getBalance();
      const contractBal1 = await marketplace.provider.getBalance(
        marketplace.address
      );

      // Buy NFT
      await marketplace.connect(user3).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('1.03'),
      });

      // Contract has 0.03 from taker fee + 0.22 from maker fee
      // Master key share is 5% of 0.25
      await marketplace.connect(owner).claimETH();
      const user1Bal2 = await user1.getBalance();

      const claimEthBalance = await marketplace.provider.getBalance(
        '0x0c6b78ed2b909E7Fc7D0d0BdA0c8AeEA3f367E0D'
      );

      const contractBal2 = await marketplace.provider.getBalance(
        marketplace.address
      );

      expect(user1Bal2.sub(user1Bal1).toString()).to.equal(
        ethers.utils.parseUnits('0.78')
      );
      // 5% should stay in the contract for master key shares
      expect(contractBal2.sub(contractBal1).toString()).to.equal(
        ethers.utils.parseUnits('0.0125')
      );

      // 95% should be claimed
      expect(claimEthBalance.toString()).to.equal(
        ethers.utils.parseUnits('0.2375')
      );
    });

    it('should be able to distribute master nft shares', async function () {
      await masterNftContract
        .connect(owner)
        .addDistributor(marketplace.address);

      // Create auction and buy NFT
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          60
        );
      await marketplace.connect(user2).bid(nftContract.address, tokenId, {
        value: ethers.utils.parseUnits('1.03'),
      });

      let currentBalances = [];

      for (let i = 0; i < 3; i++) {
        await masterNftContract.connect(owner).mintNFT(otherSigners[i].address);

        let balanceOfAccount = await otherSigners[i].getBalance();
        currentBalances.push(balanceOfAccount);
      }

      //Distribute fee, 5% of 22% of 1000 = 11
      await marketplace.connect(owner).distributeMasterNFTShares();

      // Check update balances
      for (let i = 0; i < 3; i++) {
        let updatedBalance = await otherSigners[i].getBalance();
        expect(updatedBalance.sub(currentBalances[i]).toString()).to.equal(
          ethers.utils.parseUnits('0.004166666666666666')
        );
      }
    });
  });

  describe('Cancel auctions while paused', function () {
    beforeEach(async function () {
      await deploy();
      await nftContract.connect(user1).approve(marketplace.address, tokenId);
      await marketplace
        .connect(user1)
        .createAuction(
          nftContract.address,
          tokenId,
          ethers.utils.parseUnits('1'),
          ethers.utils.parseUnits('1'),
          60
        );
    });

    it('should fail to cancel auction when not paused', async function () {
      await expect(
        marketplace
          .connect(owner)
          .cancelAuctionWhenPaused(nftContract.address, tokenId)
      ).to.be.revertedWith('Pausable: not paused');
    });

    it('should fail to cancel auction when not owner', async function () {
      await marketplace.connect(owner).pause();
      await expect(
        marketplace
          .connect(user2)
          .cancelAuctionWhenPaused(nftContract.address, tokenId)
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should be able to cancel auction as owner when paused', async function () {
      await marketplace.connect(owner).pause();
      await marketplace
        .connect(owner)
        .cancelAuctionWhenPaused(nftContract.address, tokenId);
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user1.address);
    });

    it('should be able to cancel auction as auction owner when paused', async function () {
      await marketplace.connect(owner).pause();
      await marketplace
        .connect(user1)
        .cancelAuction(nftContract.address, tokenId);
      const tokenOwner = await nftContract.ownerOf(tokenId);
      expect(tokenOwner).to.equal(user1.address);
    });
  });
});
