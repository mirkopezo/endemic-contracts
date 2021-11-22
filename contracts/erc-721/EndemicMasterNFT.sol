// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./ERC721Base.sol";

contract EndemicMasterNFT is ERC721Base {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    uint256 public maxSupply;

    function __EndemicMasterNFT_init(string memory baseTokenURI)
        external
        initializer
    {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained("Endemic Master Keys", "EMK");
        __ERC721Enumerable_init_unchained();
        __ERC721URIStorage_init_unchained();
        __ERC721Burnable_init_unchained();
        __Ownable_init_unchained();

        _setBaseURI(baseTokenURI);

        maxSupply = 50;
    }

    function mintNFT(address recipient) external onlyOwner {
        require(_tokenIdCounter.current() < maxSupply, "Minted max supply");

        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();

        _safeMint(recipient, newItemId);
    }

    uint256[50] private __gap;
}
