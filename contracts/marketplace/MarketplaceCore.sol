// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./TransferManager.sol";
import "./FeeManager.sol";

import "./LibNFT.sol";

abstract contract MarketplaceCore is
    PausableUpgradeable,
    OwnableUpgradeable,
    TransferManager,
    FeeManager
{
    using AddressUpgradeable for address;

    mapping(bytes32 => LibAuction.Auction) internal idToAuction;

    event AuctionCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        bytes32 indexed id,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration,
        address seller,
        uint256 amount,
        bytes4 assetClass
    );

    event AuctionSuccessful(
        bytes32 indexed id,
        uint256 indexed totalPrice,
        address winner,
        uint256 amount
    );

    event AuctionCancelled(bytes32 indexed id);

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _endingPrice,
        uint256 _duration,
        uint256 _amount,
        bytes4 _assetClass
    ) external whenNotPaused {
        bytes32 auctionId = createAuctionId(
            _nftContract,
            _tokenId,
            _msgSender()
        );

        LibAuction.Auction memory auction = LibAuction.Auction(
            auctionId,
            _nftContract,
            _tokenId,
            msg.sender,
            _startingPrice,
            _endingPrice,
            _duration,
            _amount,
            block.timestamp,
            _assetClass
        );

        LibAuction.validate(auction);

        LibNFT.requireTokenOwnership(
            auction.assetClass,
            auction.contractId,
            auction.tokenId,
            _amount,
            auction.seller
        );

        LibNFT.requireTokenApproval(
            auction.assetClass,
            auction.contractId,
            auction.tokenId,
            auction.seller
        );

        idToAuction[auctionId] = auction;

        emit AuctionCreated(
            _nftContract,
            _tokenId,
            auction.id,
            auction.startingPrice,
            auction.endingPrice,
            auction.duration,
            auction.seller,
            _amount,
            _assetClass
        );
    }

    function bid(bytes32 _id, uint256 _tokenAmount)
        external
        payable
        whenNotPaused
    {
        LibAuction.Auction storage auction = idToAuction[_id];

        require(LibAuction.isOnAuction(auction), "NFT is not on auction");
        require(auction.seller != _msgSender(), "Cant buy from self");
        require(
            auction.amount >= _tokenAmount && _tokenAmount >= 0,
            "Amount incorrect"
        );

        LibNFT.requireTokenOwnership(
            auction.assetClass,
            auction.contractId,
            auction.tokenId,
            _tokenAmount,
            auction.seller
        );

        LibNFT.requireTokenApproval(
            auction.assetClass,
            auction.contractId,
            auction.tokenId,
            auction.seller
        );

        uint256 price = LibAuction.currentPrice(auction) * _tokenAmount;
        require(
            msg.value >= price,
            "Bid amount can not be lower then auction price"
        );

        address seller = auction.seller;
        bytes32 auctionId = auction.id;
        address contractId = auction.contractId;
        uint256 tokenId = auction.tokenId;
        bytes4 assetClass = auction.assetClass;

        if (auction.assetClass == LibAuction.ERC721_ASSET_CLASS) {
            _removeAuction(auction);
        } else if (auction.assetClass == LibAuction.ERC1155_ASSET_CLASS) {
            _deductFromAuction(auction, _tokenAmount);
        } else {
            revert("Invalid asset class");
        }

        _handlePayment(contractId, tokenId, seller, _msgSender(), price);

        _transfer(
            seller,
            _msgSender(),
            contractId,
            tokenId,
            _tokenAmount,
            assetClass
        );

        emit AuctionSuccessful(auctionId, price, _msgSender(), _tokenAmount);
    }

    function cancelAuction(bytes32 _id) external {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction), "Invalid auction");
        require(_msgSender() == auction.seller, "Sender is not seller");
        _cancelAuction(auction);
    }

    function cancelAuctionWhenPaused(bytes32 _id)
        external
        whenPaused
        onlyOwner
    {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction));
        _cancelAuction(auction);
    }

    function getAuction(bytes32 _id)
        external
        view
        returns (
            address seller,
            uint256 startingPrice,
            uint256 endingPrice,
            uint256 duration,
            uint256 startedAt,
            uint256 amount
        )
    {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction), "Not on auction");
        return (
            auction.seller,
            auction.startingPrice,
            auction.endingPrice,
            auction.duration,
            auction.startedAt,
            auction.amount
        );
    }

    function getCurrentPrice(bytes32 _id) external view returns (uint256) {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction));
        return LibAuction.currentPrice(auction);
    }

    function createAuctionId(
        address _nftContract,
        uint256 _tokenId,
        address _seller
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(_nftContract, "-", _tokenId, "-", _seller)
            );
    }

    function _cancelAuction(LibAuction.Auction storage auction) internal {
        bytes32 auctionId = auction.id;
        _removeAuction(auction);
        emit AuctionCancelled(auctionId);
    }

    function _removeAuction(LibAuction.Auction storage auction) internal {
        delete idToAuction[auction.id];
    }

    function _deductFromAuction(
        LibAuction.Auction storage auction,
        uint256 _amount
    ) internal {
        idToAuction[auction.id].amount -= _amount;
        if (idToAuction[auction.id].amount <= 0) {
            _removeAuction(auction);
        }
    }

    function _handlePayment(
        address _nftContract,
        uint256 _tokenId,
        address _seller,
        address _buyer,
        uint256 _price
    ) internal {
        if (_price > 0) {
            uint256 takerCut = _computeTakerCut(_price, _buyer);
            require(msg.value >= _price + takerCut, "Not enough funds sent");

            uint256 makerCut = _computeMakerCut(
                _price,
                _seller,
                _nftContract,
                _tokenId
            );

            uint256 fees = takerCut + makerCut;
            uint256 sellerProceeds = _price - makerCut;

            _addMasterNFTContractShares(fees);

            (bool success, ) = payable(_seller).call{value: sellerProceeds}("");
            require(success, "Transfer failed.");
        } else {
            revert("Invalid price");
        }
    }

    function _addMasterNFTContractShares(uint256 _marketplaceCut) internal {
        masterNFTShares += (_marketplaceCut * masterNftCut) / 10000;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    uint256[50] private __gap;
}
