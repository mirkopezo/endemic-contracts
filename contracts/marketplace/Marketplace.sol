// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MarketplaceCore.sol";
import "../erc-721/IEndemicMasterNFT.sol";

contract Marketplace is MarketplaceCore {
    /// @param _makerFee - percent fee the marketplace takes on each auction from seller
    /// @param _takerFee - percent fee the marketplace takes on each auction from buyer
    /// @param _initialSaleFee - percent fee the masterplace takes on first sale
    /// @param _masterKeyCut - percent cut for master key holders
    /// @param _masterNFTContract - address of master nft contract
    ///  between 0-10,000.
    function __Marketplace_init(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleFee,
        uint256 _masterKeyCut,
        IEndemicMasterNFT _masterNFTContract,
        address feeClaimAddress
    ) external initializer {
        require(_makerFee <= 10000);
        require(_takerFee <= 10000);
        require(_initialSaleFee <= 10000);
        require(_masterKeyCut <= 10000);
        require(feeClaimAddress != address(0));

        __Context_init_unchained();
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __TransferManager___init_unchained(
            _makerFee,
            _takerFee,
            _initialSaleFee,
            _masterKeyCut,
            feeClaimAddress,
            _masterNFTContract
        );
    }

    uint256[50] private __gap;
}
