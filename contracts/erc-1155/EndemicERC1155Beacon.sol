// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract EndemicERC1155Beacon is UpgradeableBeacon {
    constructor(address impl) UpgradeableBeacon(impl) {}
}
