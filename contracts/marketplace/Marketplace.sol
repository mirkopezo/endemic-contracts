// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./MarketplaceCore.sol";
import "../erc-721/IEndemicMasterNFT.sol";
import "../erc-20/IERC20.sol";

contract Marketplace is MarketplaceCore {
    /// @param _makerFee - percent fee the marketplace takes on each auction from seller
    /// @param _takerFee - percent fee the marketplace takes on each auction from buyer
    /// @param _initialSaleCut - percent cut the masterplace takes on first sale
    /// @param _masterKeyCut - percent cut for master key holders
    /// @param _masterNFTContract - address of master nft contract (Endemic platform)
    ///  between 0-10,000.
    function __Marketplace_init(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleCut,
        uint256 _masterKeyCut,
        IEndemicMasterNFT _masterNFTContract,
        IERC20 _wrappedNEAR
    ) external initializer {
        require(_makerFee <= 10000);
        require(_takerFee <= 10000);
        require(_initialSaleCut <= 10000);
        require(_masterKeyCut <= 10000);

        __Context_init_unchained();
        __Pausable_init_unchained();
        __Ownable_init_unchained();
        __TransferManager___init_unchained(
            0x0c6b78ed2b909E7Fc7D0d0BdA0c8AeEA3f367E0D,
            _masterNFTContract,
            _wrappedNEAR
        );
        __FeeManager___init_unchained(
            _makerFee,
            _takerFee,
            _initialSaleCut,
            _masterKeyCut,
            _masterNFTContract
        );
    }

    uint256[50] private __gap;
}
