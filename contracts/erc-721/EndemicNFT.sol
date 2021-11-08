// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./ERC721Base.sol";

contract EndemicNFT is ERC721Base {
    function __EndemicNFT_init(
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

        uint256 tokenId = totalSupply() + 1;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit Mint(tokenId, artist);

        return true;
    }

    uint256[50] private __gap;
}
