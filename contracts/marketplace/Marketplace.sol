// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./MarketplaceCore.sol";
import "../erc-721/IEndemicMasterNFT.sol";

contract Marketplace is MarketplaceCore {
    /// @param _makerFee - percent fee the marketplace takes on each auction from seller
    /// @param _takerFee - percent fee the marketplace takes on each auction from buyer
    /// @param _initialSaleCut - percent cut the masterplace takes on first sale
    /// @param _masterNFTContract - address of master nft contract (Endemic platform)
    ///  between 0-10,000.
    function __Marketplace_init(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleCut,
        IEndemicMasterNFT _masterNFTContract
    ) external initializer {
        require(_makerFee <= 10000);
        require(_takerFee <= 10000);
        require(_initialSaleCut <= 10000);

        __Context_init_unchained();
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __TransferManager___init_unchained(
            0x0c6b78ed2b909E7Fc7D0d0BdA0c8AeEA3f367E0D,
            _masterNFTContract
        );
        __FeeManager___init_unchained(
            _makerFee,
            _takerFee,
            _initialSaleCut,
            500,
            _masterNFTContract
        );
    }

    uint256[50] private __gap;
}
