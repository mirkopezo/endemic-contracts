// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
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
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _auctionIds;

    mapping(uint256 => LibAuction.Auction) internal idToAuction;

    event AuctionCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed id,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration,
        address seller,
        uint256 amount,
        bytes4 assetClass
    );

    event AuctionSuccessful(
        uint256 indexed id,
        uint256 indexed totalPrice,
        address winner,
        uint256 amount,
        bytes4 assetClass
    );

    event AuctionCancelled(uint256 indexed id);

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _endingPrice,
        uint256 _duration,
        uint256 _amount,
        bytes4 _assetClass
    ) external whenNotPaused {
        _auctionIds.increment();

        LibAuction.Auction memory auction = LibAuction.Auction(
            _auctionIds.current(),
            _nftContract,
            _tokenId,
            msg.sender,
            _startingPrice,
            _endingPrice,
            _duration,
            block.timestamp,
            _amount,
            _assetClass
        );

        LibAuction.validate(auction);

        idToAuction[_auctionIds.current()] = auction;

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

    function bid(uint256 _id, uint256 _amount) external payable whenNotPaused {
        LibAuction.Auction storage auction = idToAuction[_id];

        require(LibAuction.isOnAuction(auction), "NFT is not on auction");
        require(auction.seller != _msgSender(), "Cant buy from self");
        require(auction.amount >= _amount, "Amount incorrect");

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

        uint256 price = LibAuction.currentPrice(auction) * _amount;
        require(
            msg.value >= price,
            "Bid amount can not be lower then auction price"
        );

        address seller = auction.seller;
        uint256 auctionId = auction.id;

        if (auction.assetClass == LibAuction.ERC721_ASSET_CLASS) {
            _removeAuction(auction.id);
        } else if (auction.assetClass == LibAuction.ERC1155_ASSET_CLASS) {
            _deductFromAuction(auction.id, _amount);
        } else {
            revert("Invalid asset class");
        }

        _handlePayment(
            auction.contractId,
            auction.tokenId,
            seller,
            _msgSender(),
            price
        );

        _transfer(
            seller,
            _msgSender(),
            auction.contractId,
            auction.tokenId,
            _amount,
            auction.assetClass
        );

        emit AuctionSuccessful(
            auctionId,
            price,
            _msgSender(),
            _amount,
            auction.assetClass
        );
    }

    function cancelAuction(uint256 _id) external {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction), "Invalid auction");
        require(_msgSender() == auction.seller, "Sender is not seller");
        _cancelAuction(auction.id);
    }

    function cancelAuctionWhenPaused(uint256 _id)
        external
        whenPaused
        onlyOwner
    {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction));
        _cancelAuction(auction.id);
    }

    function getAuction(uint256 _id)
        external
        view
        returns (
            address seller,
            uint256 startingPrice,
            uint256 endingPrice,
            uint256 duration,
            uint256 startedAt
        )
    {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction));
        return (
            auction.seller,
            auction.startingPrice,
            auction.endingPrice,
            auction.duration,
            auction.startedAt
        );
    }

    function getCurrentPrice(uint256 _id) external view returns (uint256) {
        LibAuction.Auction storage auction = idToAuction[_id];
        require(LibAuction.isOnAuction(auction));
        return LibAuction.currentPrice(auction);
    }

    function _cancelAuction(uint256 _id) internal {
        _removeAuction(_id);
        emit AuctionCancelled(_id);
    }

    function _removeAuction(uint256 _id) internal {
        delete idToAuction[_id];
    }

    function _deductFromAuction(uint256 _id, uint256 _amount) internal {
        idToAuction[_id].amount -= _amount;
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

            uint256 sellerProceeds = _price - makerCut;
            _addMasterNFTContractShares(makerCut + takerCut);

            (bool success, ) = payable(_seller).call{value: sellerProceeds}("");
            require(success, "Transfer failed.");
        } else {
            revert("Invalid price");
        }
    }

    function _addMasterNFTContractShares(uint256 _marketplaceCut) internal {
        masterNFTShares += (_marketplaceCut * masterNftCut) / 10000;
    }

    uint256[50] private __gap;
}
