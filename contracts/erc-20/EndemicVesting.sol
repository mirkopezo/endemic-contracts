// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract EndemicVesting {
    using SafeMath for uint256;
    using SafeMath for uint16;

    uint256 internal constant SECONDS_PER_DAY = 86400;

    ERC20 public token;

    mapping(uint256 => Grant) public tokenGrants;
    mapping(address => uint256[]) private activeGrants;
    address public multiSig;
    uint256 public totalVestingCount;

    struct Grant {
        uint256 startTime;
        uint256 amount;
        uint16 vestingDuration;
        uint16 vestingCliff;
        uint16 vestingInterval;
        uint16 daysClaimed;
        uint256 totalClaimed;
        address recipient;
    }

    event GrantAdded(address indexed recipient, uint256 vestingId);
    event GrantTokensClaimed(address indexed recipient, uint256 amountClaimed);
    event GrantRemoved(
        address recipient,
        uint256 amountVested,
        uint256 amountNotVested
    );
    event ChangedMultisig(address multisig);

    modifier onlyMultiSig() {
        require(msg.sender == multiSig, "Not multisig");
        _;
    }

    modifier onlyValidAddress(address recipient) {
        require(
            recipient != address(0) &&
                recipient != address(this) &&
                recipient != address(token),
            "Not valid _recipient"
        );
        _;
    }

    constructor(ERC20 _token, address _multisig) {
        require(address(_token) != address(0));
        multiSig = _multisig;
        token = _token;
    }

    function addTokenGrant(
        address _recipient,
        uint256 _startTime,
        uint256 _amount,
        uint16 _vestingDurationInDays,
        uint16 _vestingCliffInDays,
        uint16 _vestingIntervalInDays
    ) external onlyMultiSig {
        require(_vestingCliffInDays <= 2 * 365, "cliff more than 2 years");
        require(
            _vestingDurationInDays <= 10 * 365,
            "duration more than 10 years"
        );
        require(_vestingIntervalInDays >= 1, "interval too small");
        require(
            _vestingDurationInDays >= _vestingCliffInDays,
            "Duration < Cliff"
        );
        require(
            _vestingDurationInDays % _vestingIntervalInDays == 0,
            "duration not in harmony with interval"
        );

        uint256 amountVestedPerDay = _amount.div(_vestingDurationInDays);
        require(amountVestedPerDay > 0, "amountVestedPerDay > 0");

        uint256 amountVestedPerInterval = _vestingIntervalInDays.mul(
            amountVestedPerDay
        );
        require(amountVestedPerInterval > 0, "amountVestedPerInterval > 0");

        // Transfer the grant tokens under the control of the vesting contract
        require(
            token.transferFrom(multiSig, address(this), _amount),
            "transfer failed"
        );

        Grant memory grant = Grant({
            startTime: _startTime == 0 ? currentTime() : _startTime,
            amount: _amount,
            vestingDuration: _vestingDurationInDays,
            vestingCliff: _vestingCliffInDays,
            vestingInterval: _vestingIntervalInDays,
            daysClaimed: 0,
            totalClaimed: 0,
            recipient: _recipient
        });
        tokenGrants[totalVestingCount] = grant;
        activeGrants[_recipient].push(totalVestingCount);
        emit GrantAdded(_recipient, totalVestingCount);
        totalVestingCount++;
    }

    function getActiveGrants(address _recipient)
        public
        view
        returns (uint256[] memory)
    {
        return activeGrants[_recipient];
    }

    function calculateGrantClaim(uint256 _grantId)
        public
        view
        returns (uint16, uint256)
    {
        Grant storage tokenGrant = tokenGrants[_grantId];

        // For grants created with a future start date, that hasn't been reached, return 0, 0
        if (currentTime() < tokenGrant.startTime) {
            return (0, 0);
        }

        // Check cliff was reached
        uint256 elapsedTime = currentTime().sub(tokenGrant.startTime);
        uint256 elapsedDays = elapsedTime.div(SECONDS_PER_DAY);

        if (elapsedDays < tokenGrant.vestingCliff) {
            return (uint16(elapsedDays), 0);
        }

        // If over vesting duration, all tokens vested
        if (elapsedDays >= tokenGrant.vestingDuration) {
            uint256 remainingGrant = tokenGrant.amount.sub(
                tokenGrant.totalClaimed
            );
            return (tokenGrant.vestingDuration, remainingGrant);
        } else {
            uint16 daysVested = uint16(elapsedDays.sub(tokenGrant.daysClaimed));
            uint16 effectiveDaysVested = (daysVested /
                tokenGrant.vestingInterval) * tokenGrant.vestingInterval;
            if (effectiveDaysVested <= 0) {
                return (daysVested, 0);
            }

            uint256 amountVested = tokenGrant
                .amount
                .mul(effectiveDaysVested)
                .div(tokenGrant.vestingDuration);

            return (daysVested, amountVested);
        }
    }

    /// @notice Allows a grant recipient to claim their vested tokens. Errors if no tokens have vested
    function claimVestedTokens(uint256 _grantId) external {
        uint16 daysVested;
        uint256 amountVested;
        (daysVested, amountVested) = calculateGrantClaim(_grantId);
        require(amountVested > 0, "amountVested is 0");

        Grant storage tokenGrant = tokenGrants[_grantId];
        tokenGrant.daysClaimed = uint16(tokenGrant.daysClaimed.add(daysVested));
        tokenGrant.totalClaimed = uint256(
            tokenGrant.totalClaimed.add(amountVested)
        );

        require(
            token.transfer(tokenGrant.recipient, amountVested),
            "no tokens"
        );
        emit GrantTokensClaimed(tokenGrant.recipient, amountVested);
    }

    /// @notice Terminate token grant transferring all vested tokens to the `_grantId`
    /// and returning all non-vested tokens to the MultiSig
    /// Secured to the MultiSig only
    /// @param _grantId grantId of the token grant recipient
    function removeTokenGrant(uint256 _grantId) external onlyMultiSig {
        Grant storage tokenGrant = tokenGrants[_grantId];
        address recipient = tokenGrant.recipient;
        uint16 daysVested;
        uint256 amountVested;
        (daysVested, amountVested) = calculateGrantClaim(_grantId);

        uint256 amountNotVested = (
            tokenGrant.amount.sub(tokenGrant.totalClaimed)
        ).sub(amountVested);

        require(token.transfer(recipient, amountVested));
        require(token.transfer(multiSig, amountNotVested));

        tokenGrant.startTime = 0;
        tokenGrant.amount = 0;
        tokenGrant.vestingDuration = 0;
        tokenGrant.vestingCliff = 0;
        tokenGrant.daysClaimed = 0;
        tokenGrant.totalClaimed = 0;
        tokenGrant.recipient = address(0);

        emit GrantRemoved(recipient, amountVested, amountNotVested);
    }

    function currentTime() public view returns (uint256) {
        return block.timestamp;
    }

    function tokensVestedPerDay(uint256 _grantId)
        public
        view
        returns (uint256)
    {
        Grant storage tokenGrant = tokenGrants[_grantId];
        return tokenGrant.amount.div(uint256(tokenGrant.vestingDuration));
    }

    function changeMultiSig(address _newMultisig)
        external
        onlyMultiSig
        onlyValidAddress(_newMultisig)
    {
        multiSig = _newMultisig;
        emit ChangedMultisig(_newMultisig);
    }
}
