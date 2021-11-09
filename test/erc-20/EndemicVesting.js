const { expect } = require('chai');
const { ethers, network } = require('hardhat');
const BN = require('bignumber.js');
const {
  deployEndemicToken,
  deployEndemicVesting,
} = require('../helpers/deploy');
const { signMessage } = require('../helpers/sign');

describe('EndemicVesting', function () {
  let user1, user2;
  let endemicToken, endemicVesting;
  const secondsInDay = 86400;

  const currentTime = () => endemicVesting.currentTime();
  const travelToFuture = async (secondsInFuture) => {
    await network.provider.send('evm_increaseTime', [secondsInFuture]);
    await network.provider.send('evm_mine');
  };

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    endemicToken = await deployEndemicToken(user1);
    endemicVesting = await deployEndemicVesting(
      user1,
      endemicToken.address,
      owner.address
    );

    await endemicToken
      .connect(owner)
      .approve(endemicVesting.address, ethers.utils.parseUnits('10000'));
  });

  describe('Add token grant', () => {
    it('adds token grant and emits event', async () => {
      const tx = await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        2,
        1
      );

      await expect(tx)
        .to.emit(endemicVesting, 'GrantAdded')
        .withArgs(user2.address, 0);

      expect(await endemicVesting.totalVestingCount()).to.equal('1');
      expect(
        (await endemicVesting.getActiveGrants(user2.address)).map((x) =>
          x.toString()
        )[0]
      ).to.equal('0');
    });

    it('respects add grant rules', async () => {
      await expect(
        endemicVesting.addTokenGrant(
          user2.address,
          await currentTime(),
          ethers.utils.parseUnits('1000'),
          10,
          800, //clif
          1
        )
      ).to.be.revertedWith('cliff more than 2 years');

      await expect(
        endemicVesting.addTokenGrant(
          user2.address,
          await currentTime(),
          ethers.utils.parseUnits('1000'),
          4000, // duration
          10,
          1
        )
      ).to.be.revertedWith('duration more than 10 years');

      await expect(
        endemicVesting.addTokenGrant(
          user2.address,
          await currentTime(),
          ethers.utils.parseUnits('1000'),
          5, // duration
          10, //clif
          1
        )
      ).to.be.revertedWith('Duration < Cliff');

      await expect(
        endemicVesting.addTokenGrant(
          user2.address,
          await currentTime(),
          ethers.utils.parseUnits('1000'),
          10, // duration
          1, //clif
          4
        )
      ).to.be.revertedWith('duration not in harmony with interval');

      await expect(
        endemicVesting.addTokenGrant(
          user2.address,
          await currentTime(),
          ethers.utils.parseUnits('0'),
          10, // duration
          1, //clif
          1
        )
      ).to.be.revertedWith('amountVestedPerDay > 0');
    });

    it('adds multiple grants for same use', async () => {
      await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        2,
        1
      );

      await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('100'),
        10,
        2,
        1
      );

      const [grant1, grant2] = (
        await endemicVesting.getActiveGrants(user2.address)
      ).map((x) => x.toString());

      expect(grant1).to.equal('0');
      expect(grant2).to.equal('1');
    });
  });

  describe('Remove grant', () => {
    it('removes grant before clif', async () => {
      await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        2,
        1
      );

      await travelToFuture(secondsInDay / 2); //forward 0.5 days

      const tx = await endemicVesting.removeTokenGrant(0);

      await expect(tx)
        .to.emit(endemicVesting, 'GrantRemoved')
        .withArgs(
          user2.address,
          ethers.utils.parseUnits('0'),
          ethers.utils.parseUnits('1000')
        );
    });

    it('removes grant with vested amount', async () => {
      await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        2,
        1
      );

      await travelToFuture(5 * secondsInDay); //forward 5 days

      const tx = await endemicVesting.removeTokenGrant(0);

      await expect(tx)
        .to.emit(endemicVesting, 'GrantRemoved')
        .withArgs(
          user2.address,
          ethers.utils.parseUnits('500'),
          ethers.utils.parseUnits('500')
        );

      expect(await endemicToken.balanceOf(user2.address)).to.equal(
        ethers.utils.parseUnits('500')
      );
    });
  });

  describe('Grant claim', () => {
    it('can claim grant', async () => {
      await endemicVesting.addTokenGrant(
        user2.address,
        await currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        1,
        2
      );

      await expect(endemicVesting.claimVestedTokens(0)).to.be.revertedWith(
        'amountVested is 0'
      );

      await travelToFuture(secondsInDay); //forward 1 day
      await expect(endemicVesting.claimVestedTokens(0)).to.be.revertedWith(
        'amountVested is 0'
      );

      await travelToFuture(1 * secondsInDay); //forward 1 day
      await expect(endemicVesting.claimVestedTokens(0))
        .to.emit(endemicVesting, 'GrantTokensClaimed')
        .withArgs(user2.address, ethers.utils.parseUnits('200'));

      await travelToFuture(1 * secondsInDay); //forward 1 day
      await expect(endemicVesting.claimVestedTokens(0)).to.be.revertedWith(
        'amountVested is 0'
      );

      await travelToFuture(1.5 * secondsInDay); //forward 1.5 day
      await expect(endemicVesting.claimVestedTokens(0))
        .to.emit(endemicVesting, 'GrantTokensClaimed')
        .withArgs(user2.address, ethers.utils.parseUnits('200'));

      await travelToFuture(10 * secondsInDay); //forward 10 day
      await expect(endemicVesting.claimVestedTokens(0))
        .to.emit(endemicVesting, 'GrantTokensClaimed')
        .withArgs(user2.address, ethers.utils.parseUnits('600'));

      expect(await endemicToken.balanceOf(user2.address)).to.equal(
        ethers.utils.parseUnits('1000')
      );
    });

    it('calculated token vested per day', async () => {
      await endemicVesting.addTokenGrant(
        user2.address,
        await endemicVesting.currentTime(),
        ethers.utils.parseUnits('1000'),
        10,
        1,
        2
      );

      expect(await endemicVesting.tokensVestedPerDay(0)).to.equal(
        ethers.utils.parseUnits('100')
      );
    });
  });

  describe('Multisig change', () => {
    it('changes multisig', async () => {
      await endemicVesting.changeMultiSig(user2.address);
      expect(await endemicVesting.multiSig()).to.equal(user2.address);
    });

    it('cant change multsig if not multsig', async () => {
      await expect(
        endemicVesting.connect(user2).changeMultiSig(user2.address)
      ).to.be.revertedWith('Not multisig');
    });
  });
});
