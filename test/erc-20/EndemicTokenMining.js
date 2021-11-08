const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  deployEndemicToken,
  deployEndemicTokenMining,
} = require('../helpers/deploy');
const { sign, hashAndSign } = require('../helpers/sign');

describe('EndemicTokenMining', function () {
  let owner, user1, user2;
  let endemicToken, endemicTokenMining;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    endemicToken = await deployEndemicToken();
    endemicTokenMining = await deployEndemicTokenMining(endemicToken.address);

    await endemicToken.transfer(
      endemicTokenMining.address,
      ethers.utils.parseUnits('1000')
    ); // 1000 END
  });

  it('claims balances signed by owner', async () => {
    // Todo
  });
});
