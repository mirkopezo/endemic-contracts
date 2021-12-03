// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BidCore.sol";

contract Bid is BidCore {
    /// @param _fee - percent fee the marketplace takes on each successful bid
    /// @param _masterNFTContract - address of master nft contract
    /// @param _feeClaimAddress - address to call claim eth
    ///  between 0-10,000.
    function __Bid_init(
        uint256 _fee,
        address _masterNFTContract,
        address _feeClaimAddress
    ) external initializer {
        require(_fee <= 10000);
        require(_masterNFTContract != address(0));
        require(_feeClaimAddress != address(0));

        __Context_init_unchained();
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __BidCore___init_unchained(_fee, _masterNFTContract, _feeClaimAddress);
    }

    uint256[50] private __gap;
}
