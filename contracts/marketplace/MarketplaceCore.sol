// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./TransferManager.sol";
import "./FeeManager.sol";
import "../erc-721/IERC721.sol";
import "../erc-1155/IERC1155.sol";

abstract contract MarketplaceCore is
    PausableUpgradeable,
    OwnableUpgradeable,
    TransferManager,
    FeeManager
{
    using AddressUpgradeable for address;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _auctionIds;

    mapping(address => mapping(uint256 => Auction)) internal tokenIdToAuction;
    bytes4 public constant ERC721_Interface = bytes4(0x80ac58cd);
    bytes4 public constant ERC1155_Interface = bytes4(0xd9b67a26);

    struct Auction {
        uint256 id;
        address seller;
        uint256 startingPrice;
        uint256 endingPrice;
        uint256 duration;
        // NOTE: 0 if this auction has been concluded
        uint256 startedAt;
    }

    event AuctionCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed startingPrice,
        uint256 endingPrice,
        uint256 duration,
        uint256 id,
        address seller
    );

    event AuctionSuccessful(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed totalPrice,
        address winner,
        uint256 id
    );

    event AuctionCancelled(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 id
    );

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
        uint256 _duration
    ) external whenNotPaused {
        _requireERC721(_nftContract);

        require(
            _ownsERC721(msg.sender, _nftContract, _tokenId),
            "Seller is not owner of the asset"
        );

        require(
            _isApproved(msg.sender, _nftContract, _tokenId),
            "Marketplace is not approved for the asset"
        );
        require(_duration >= 1 minutes, "Auction too short");
        require(
            _startingPrice >= 0.0001 ether && _endingPrice >= 0.0001 ether,
            "Prices too low"
        );
        require(_startingPrice >= _endingPrice, "Prices invalid");

        _auctionIds.increment();

        Auction memory auction = Auction(
            _auctionIds.current(),
            msg.sender,
            _startingPrice,
            _endingPrice,
            _duration,
            block.timestamp
        );

        tokenIdToAuction[_nftContract][_tokenId] = auction;

        emit AuctionCreated(
            _nftContract,
            uint256(_tokenId),
            uint256(auction.startingPrice),
            uint256(auction.endingPrice),
            uint256(auction.duration),
            uint256(auction.id),
            auction.seller
        );
    }

    function bid(address _nftContract, uint256 _tokenId)
        external
        payable
        whenNotPaused
    {
        Auction storage auction = tokenIdToAuction[_nftContract][_tokenId];

        require(_isOnAuction(auction), "NFT is not on auction");
        require(auction.seller != _msgSender(), "Cant buy from self");
        require(
            _ownsERC721(auction.seller, _nftContract, _tokenId),
            "Seller is no longer owner"
        );
        require(
            _isApproved(auction.seller, _nftContract, _tokenId),
            "Marketplace is no longer approved for the asset"
        );

        uint256 price = _currentPrice(auction);
        require(
            msg.value >= price,
            "Bid amount can not be lower then auction price"
        );

        address seller = auction.seller;
        uint256 auctionId = auction.id;

        _removeAuction(_nftContract, _tokenId);
        _handlePayment(_nftContract, _tokenId, seller, _msgSender(), price);

        _transfer(seller, _msgSender(), _nftContract, _tokenId);

        emit AuctionSuccessful(
            _nftContract,
            _tokenId,
            price,
            _msgSender(),
            auctionId
        );
    }

    function cancelAuction(address _nftContract, uint256 _tokenId) external {
        Auction storage auction = tokenIdToAuction[_nftContract][_tokenId];
        require(_isOnAuction(auction), "Invalid auction");
        require(_msgSender() == auction.seller, "Sender is not seller");
        uint256 auctionId = auction.id;
        _cancelAuction(_nftContract, _tokenId, auctionId);
    }

    function cancelAuctionWhenPaused(address _nftContract, uint256 _tokenId)
        external
        whenPaused
        onlyOwner
    {
        Auction storage auction = tokenIdToAuction[_nftContract][_tokenId];
        require(_isOnAuction(auction));
        _cancelAuction(_nftContract, _tokenId, auction.id);
    }

    function getAuction(address _nftContract, uint256 _tokenId)
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
        Auction storage auction = tokenIdToAuction[_nftContract][_tokenId];
        require(_isOnAuction(auction));
        return (
            auction.seller,
            auction.startingPrice,
            auction.endingPrice,
            auction.duration,
            auction.startedAt
        );
    }

    function getCurrentPrice(address _nftContract, uint256 _tokenId)
        external
        view
        returns (uint256)
    {
        Auction storage auction = tokenIdToAuction[_nftContract][_tokenId];
        require(_isOnAuction(auction));
        return _currentPrice(auction);
    }

    function _ownsERC721(
        address _seller,
        address _nftContract,
        uint256 _tokenId
    ) internal view returns (bool) {
        return (IERC721(_nftContract).ownerOf(_tokenId) == _seller);
    }

    function _isApproved(
        address _seller,
        address _nftContract,
        uint256 _tokenId
    ) internal view returns (bool) {
        IERC721 nft = IERC721(_nftContract);
        return
            nft.getApproved(_tokenId) == address(this) ||
            nft.isApprovedForAll(_seller, address(this));
    }

    function _requireERC721(address _nftContract) internal view {
        require(
            IERC721(_nftContract).supportsInterface(ERC721_Interface),
            "Contract has an invalid ERC721 implementation"
        );
    }

    function _requireERC1155(address _nftContract) internal view {
        require(
            IERC1155(_nftContract).supportsInterface(ERC1155_Interface),
            "Contract has an invalid ERC1155 implementation"
        );
    }

    function _cancelAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _auctionId
    ) internal {
        _removeAuction(_nftContract, _tokenId);
        emit AuctionCancelled(_nftContract, _tokenId, _auctionId);
    }

    function _removeAuction(address _nftContract, uint256 _tokenId) internal {
        delete tokenIdToAuction[_nftContract][_tokenId];
    }

    function _isOnAuction(Auction storage _auction)
        internal
        view
        returns (bool)
    {
        return (_auction.startedAt > 0);
    }

    function _currentPrice(Auction storage _auction)
        internal
        view
        returns (uint256)
    {
        uint256 secondsPassed = 0;

        if (block.timestamp > _auction.startedAt) {
            secondsPassed = block.timestamp - _auction.startedAt;
        }

        return
            _computeCurrentPrice(
                _auction.startingPrice,
                _auction.endingPrice,
                _auction.duration,
                secondsPassed
            );
    }

    function _computeCurrentPrice(
        uint256 _startingPrice,
        uint256 _endingPrice,
        uint256 _duration,
        uint256 _secondsPassed
    ) internal pure returns (uint256) {
        // NOTE: We don't use SafeMath (or similar) in this function because
        //  all of our public functions carefully cap the maximum values for
        //  time (at 64-bits) and currency (at 128-bits). _duration is
        //  also known to be non-zero (see the require() statement in
        //  _addAuction())
        if (_secondsPassed >= _duration) {
            // We've reached the end of the dynamic pricing portion
            // of the auction, just return the end price.
            return _endingPrice;
        } else {
            // Starting price can be higher than ending price (and often is!), so
            // this delta can be negative.
            int256 totalPriceChange = int256(_endingPrice) -
                int256(_startingPrice);

            // This multiplication can't overflow, _secondsPassed will easily fit within
            // 64-bits, and totalPriceChange will easily fit within 128-bits, their product
            // will always fit within 256-bits.
            int256 currentPriceChange = (totalPriceChange *
                int256(_secondsPassed)) / int256(_duration);

            // currentPriceChange can be negative, but if so, will have a magnitude
            // less that _startingPrice. Thus, this result will always end up positive.
            int256 currentPrice = int256(_startingPrice) + currentPriceChange;

            return uint256(currentPrice);
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
