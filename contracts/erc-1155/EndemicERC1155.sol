// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "./ERC1155Base.sol";

contract EndemicERC1155 is ERC1155Base {
    function __EndemicERC1155_init(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) external initializer {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC1155_init_unchained("");
        __ERC1155Base_init_unchained(name, symbol);
        __ERC1155Burnable_init_unchained();
        __Ownable_init_unchained();

        _setBaseURI(baseTokenURI);
    }

    event Mint(uint256 indexed tokenId, address artistId);

    struct MintData {
        address recipient;
        address artist;
        uint256 tokenId;
        uint256 amount;
        uint256 supply;
        string tokenURI;
    }

    function mint(MintData calldata data) external {
        require(
            _msgSender() == owner() || isApprovedForAll(owner(), _msgSender()),
            "mint caller is not owner nor approved"
        );
        require(data.amount > 0, "amount incorrect");

        if (supply[data.tokenId] == 0) {
            require(data.supply > 0, "supply incorrect");

            _saveSupply(data.tokenId, data.supply);
            _setTokenURI(data.tokenId, data.tokenURI);
        }

        _mint(data.recipient, data.tokenId, data.amount, "");

        emit Mint(data.tokenId, data.artist);
    }

    uint256[50] private __gap;
}
