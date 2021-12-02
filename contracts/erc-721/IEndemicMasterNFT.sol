// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./IERC721.sol";

interface IEndemicMasterNFT is IERC721 {
    function distributeShares() external payable;

    function balanceOf(address _owner) external view returns (uint256 balance);
}
