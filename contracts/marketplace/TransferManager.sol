// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../erc-721/IERC721.sol";
import "../erc-1155/IERC1155.sol";
import "../erc-721/IEndemicMasterNFT.sol";
import "./LibAuction.sol";

abstract contract TransferManager is OwnableUpgradeable {
    uint256 public makerFee;
    uint256 public takerFee;
    uint256 public initialSaleFee;
    uint256 public masterNftCut;
    uint256 public masterNftShares;

    mapping(address => mapping(uint256 => bool)) tradedTokens;

    address claimEthAddress;

    IEndemicMasterNFT masterNFT;

    function __TransferManager___init_unchained(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleFee,
        uint256 _masterNftCut,
        address _claimEthAddress,
        IEndemicMasterNFT _masterNFT
    ) internal initializer {
        makerFee = _makerFee;
        takerFee = _takerFee;
        initialSaleFee = _initialSaleFee;
        masterNftCut = _masterNftCut;
        masterNFT = _masterNFT;
        claimEthAddress = _claimEthAddress;
    }

    function updateFee(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleFee,
        uint256 _masterNftCut
    ) external onlyOwner {
        require(_makerFee <= 10000);
        require(_takerFee <= 10000);
        require(_initialSaleFee <= 10000);
        require(_masterNftCut <= 10000);
        makerFee = _makerFee;
        takerFee = _takerFee;
        initialSaleFee = _initialSaleFee;
        masterNftCut = _masterNftCut;
    }

    function getMakerFee(
        address seller,
        address nftContract,
        uint256 tokenId
    ) public view returns (uint256) {
        require(seller != address(0));
        require(nftContract != address(0));

        if (_isAdressOwnerOfMasterNft(seller)) {
            return 0;
        }

        bool isInitialSale = !tradedTokens[nftContract][tokenId];
        return isInitialSale ? initialSaleFee : makerFee;
    }

    function getTakerFee(address buyer) public view returns (uint256) {
        require(buyer != address(0));
        if (_isAdressOwnerOfMasterNft(buyer)) {
            return 0;
        }

        return takerFee;
    }

    function _computeMakerCut(
        uint256 price,
        address seller,
        address nftContract,
        uint256 tokenId
    ) internal returns (uint256) {
        bool isInitialSale = !tradedTokens[nftContract][tokenId];
        if (isInitialSale) {
            tradedTokens[nftContract][tokenId] = true;
        }

        if (_isAdressOwnerOfMasterNft(seller)) {
            return 0;
        }

        uint256 makerCut = isInitialSale ? initialSaleFee : makerFee;

        return (price * makerCut) / 10000;
    }

    function _computeTakerCut(uint256 price, address buyer)
        internal
        view
        returns (uint256)
    {
        if (_isAdressOwnerOfMasterNft(buyer)) {
            return 0;
        }

        return (price * takerFee) / 10000;
    }

    function _isAdressOwnerOfMasterNft(address _address)
        internal
        view
        returns (bool)
    {
        uint256 balance = masterNFT.balanceOf(_address);
        return balance > 0;
    }

    function claimETH() external onlyOwner {
        uint256 claimableETH = address(this).balance - masterNftShares;
        (bool success, ) = payable(claimEthAddress).call{value: claimableETH}(
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
        masterNftShares += (marketplaceCut * masterNftCut) / 10000;
    }

    uint256[50] private __gap;
}
