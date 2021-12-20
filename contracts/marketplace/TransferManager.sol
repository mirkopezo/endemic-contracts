// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../erc-721/IERC721.sol";
import "../erc-1155/IERC1155.sol";
import "../erc-721/IEndemicMasterNFT.sol";
import "../fee/IFeeProvider.sol";
import "./LibAuction.sol";

abstract contract TransferManager is OwnableUpgradeable {
    uint256 public masterNftShares;
    address feeClaimAddress;

    IFeeProvider feeProvider;
    IEndemicMasterNFT masterNFT;

    function __TransferManager___init_unchained(
        IFeeProvider _feeProvider,
        IEndemicMasterNFT _masterNFT,
        address _feeClaimAddress
    ) internal initializer {
        feeProvider = _feeProvider;
        masterNFT = _masterNFT;
        feeClaimAddress = _feeClaimAddress;
    }

    function _computeMakerCut(
        uint256 price,
        address seller,
        address nftContract,
        uint256 tokenId
    ) internal view returns (uint256) {
        uint256 makerFee = feeProvider.getMakerFee(
            seller,
            nftContract,
            tokenId
        );

        return (price * makerFee) / 10000;
    }

    function _computeTakerCut(uint256 price, address buyer)
        internal
        view
        returns (uint256)
    {
        uint256 takerFee = feeProvider.getTakerFee(buyer);
        return (price * takerFee) / 10000;
    }

    function claimETH() external onlyOwner {
        uint256 claimableETH = address(this).balance - masterNftShares;
        (bool success, ) = payable(feeClaimAddress).call{value: claimableETH}(
            ""
        );
        require(success, "Transfer failed.");
    }

    function distributeMasterNftShares() external onlyOwner {
        require(address(this).balance >= masterNftShares, "Not enough funds");
        masterNFT.distributeShares{value: masterNftShares}();
        masterNftShares = 0;
    }

    function _transferFunds(
        address nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    ) internal {
        if (price > 0) {
            uint256 takerCut = _computeTakerCut(price, buyer);
            require(msg.value >= price + takerCut, "Not enough funds sent");

            uint256 makerCut = _computeMakerCut(
                price,
                seller,
                nftContract,
                tokenId
            );

            uint256 fees = takerCut + makerCut;
            uint256 sellerProceeds = price - makerCut;

            _addMasterNftContractShares(fees);

            feeProvider.onInitialSale(nftContract, tokenId);

            (bool success, ) = payable(seller).call{value: sellerProceeds}("");
            require(success, "Transfer failed.");
        } else {
            revert("Invalid price");
        }
    }

    function _transferNFT(
        address owner,
        address receiver,
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        bytes4 assetClass
    ) internal {
        if (assetClass == LibAuction.ERC721_ASSET_CLASS) {
            IERC721(nftContract).safeTransferFrom(owner, receiver, tokenId);
        } else if (assetClass == LibAuction.ERC1155_ASSET_CLASS) {
            IERC1155(nftContract).safeTransferFrom(
                owner,
                receiver,
                tokenId,
                amount,
                ""
            );
        } else {
            revert("Invalid asset class");
        }
    }

    function _addMasterNftContractShares(uint256 marketplaceCut) internal {
        masterNftShares +=
            (marketplaceCut * feeProvider.getMasterNftCut()) /
            10000;
    }

    uint256[50] private __gap;
}
