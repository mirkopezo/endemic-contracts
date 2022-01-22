// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ERC721Base.sol";
/* --- Layer Zero imports --- */
import "../layer-zero/interfaces/ILayerZeroEndpoint.sol";
import "../layer-zero/interfaces/ILayerZeroReceiver.sol";
/* --- Import lib that compares bytes with address --- */
import "../libs/BytesLib.sol";
/* --- Import lib that extracts URI without baseURI --- */
import "../libs/StringLib.sol";

contract EndemicMultiChainNFT is ERC721Base, ILayerZeroReceiver {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    using BytesLib for bytes;
    using StringLib for string;

    bool private _initDestination;
    bool private _initEndpoint;

    ILayerZeroEndpoint private endpoint;
    address private destinationContractAddress;

    function __EndemicMultiChainNFT_init(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) external initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained(name, symbol);
        __ERC721Enumerable_init_unchained();
        __ERC721Burnable_init_unchained();
        __ERC721URIStorage_init_unchained();
        __Ownable_init_unchained();

        _setBaseURI(baseTokenURI);
    }

    event Mint(uint256 indexed tokenId, address artistId);

    function mint(
        address recipient,
        address artist,
        string calldata tokenURI
    ) external returns (bool) {
        require(
            _msgSender() == owner() || isApprovedForAll(owner(), _msgSender()),
            "mint caller is not owner nor approved"
        );

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit Mint(tokenId, artist);

        return true;
    }

    // Set destination ERC721 duplicate contract address on other chain.
    function setDestinationContractAddress(address _destinationContractAddress)
        public
        onlyOwner
    {
        require(
            !_initDestination,
            "destination contract address is already initialized"
        );
        _initDestination = true;
        destinationContractAddress = _destinationContractAddress;
    }

    // Endpoint address could probably be set in __EndemicNFT_init() function.
    function setEndpointAddress(address _endpointAddress) public onlyOwner {
        require(!_initEndpoint, "endpoint address is already initialized");
        endpoint = ILayerZeroEndpoint(_endpointAddress);
    }

    /// @notice Transfers one specific NFT to another chain.
    /// @dev It burns NFT on sender chain, and mints on destination chain. We must
    /// have same ERC721 contract on both chains.
    /// @param _dstChainId Chain Id of destination chain.
    /// @param _dstEndemicMultiChainNftAddr ERC721 contract address on destination chain.
    /// @param _tokenId Token Id of NFT that we want to transfer.
    /// @return True if function comes to end.
    function transferNftToOtherChain(
        uint16 _dstChainId,
        bytes calldata _dstEndemicMultiChainNftAddr,
        uint256 _tokenId
    ) public payable returns (bool) {
        require(
            _initDestination,
            "must set destination contract address before transferring"
        );

        string memory uri = tokenURI(_tokenId);

        burn(_tokenId);

        bytes memory payload = abi.encode(
            _msgSender(),
            uri.removeBaseURI(baseURI)
        );

        endpoint.send{value: msg.value}(
            _dstChainId,
            _dstEndemicMultiChainNftAddr,
            payload,
            payable(_msgSender()),
            address(0x0),
            bytes("")
        );

        return true;
    }

    /// @notice Mints NFT on this (destination) chain.
    /// @dev We don't call this function its automatically called by endpoint.
    /// @param _srcChainId Chain Id of source chain.
    /// @param _srcAddress Address that initiated this transfer.
    /// @param _nonce Nonce.
    /// @param _payload Payload that includes URI and address of NFT owner.
    function lzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override {
        require(_msgSender() == address(endpoint), "only for endpoint");
        require(
            _initDestination,
            "must set destination contract address before minting on this chain"
        );
        require(_srcAddress.equals(destinationContractAddress));

        (address toAddr, string memory uri) = abi.decode(
            _payload,
            (address, string)
        );

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(toAddr, tokenId);
        _setTokenURI(tokenId, uri);

        emit Mint(tokenId, toAddr);
    }

    uint256[50] private __gap;
}
