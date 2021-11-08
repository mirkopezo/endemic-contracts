const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  deployEndemicToken,
  deployEndemicVesting,
} = require('../helpers/deploy');
const { signMessage } = require('../helpers/sign');

describe('EndemicVesting', function () {
  let user1, user2;
  let endemicToken, endemicVesting;

  beforeEach(async () => {
    [user1, user2] = await ethers.getSigners();

    endemicToken = await deployEndemicToken(user1);
    endemicVesting = await deployEndemicVesting(
      user1,
      endemicToken.address,
      user1.address
    );
  });

  it('works for END scenario', () => {
    // address _recipient,
    // uint256 _startTime,
    // uint256 _amount,
    // uint16 _vestingDurationInDays,
    // uint16 _vestingCliffInDays,
    // uint16 _vestingIntervalInDays
  });
});
