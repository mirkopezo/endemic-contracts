// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../roles/DistributorRole.sol";
import "./ERC721Base.sol";

contract EndemicMasterNFT is DistributorRole, ERC721Base {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    CountersUpgradeable.Counter private _tokenIdCounter;

    uint256 public price;
    bool public saleIsActive;
    uint256 public maxSupply;
    address claimEthAddress;

    function __EndemicMasterNFT_init(string memory baseTokenURI)
        external
        initializer
    {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __ERC721_init_unchained("Lost Animals of the World", "LAW");
        __ERC721Enumerable_init_unchained();
        __ERC721URIStorage_init_unchained();
        __ERC721Burnable_init_unchained();
        __Ownable_init_unchained();

        _setBaseURI(baseTokenURI);

        price = 15 ether;
        saleIsActive = false;
        maxSupply = 50;
        claimEthAddress = 0x0c6b78ed2b909E7Fc7D0d0BdA0c8AeEA3f367E0D;
    }

    function mintNFT(address recipient) external onlyOwner {
        require(_tokenIdCounter.current() < maxSupply, "Minted max supply");

        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();

        _safeMint(recipient, newItemId);
    }

    function publicMintNFT() external payable {
        require(saleIsActive, "Sale must be active");
        require(_tokenIdCounter.current() < maxSupply, "Minted max supply");

        require(price <= msg.value, "ETH sent is incorrect");

        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();

        _safeMint(_msgSender(), newItemId);
    }

    function distributeShares() external payable onlyDistributor {
        require(msg.value > 0, "Value can't be zero");
        require(totalSupply() > 0, "Total supply can't be zero");

        uint256 shares = msg.value / totalSupply();

        for (uint256 i = 0; i < totalSupply(); i++) {
            uint256 tokenId = tokenByIndex(i);
            address tokenOwner = ownerOf(tokenId);
            (bool success, ) = payable(tokenOwner).call{value: shares}("");
            require(success, "Transfer failed.");
        }
    }

    function setBaseTokenURI(string memory baseTokenURI) external onlyOwner {
        _setBaseURI(baseTokenURI);
    }

    function claimETH() external onlyOwner {
        (bool success, ) = payable(claimEthAddress).call{
            value: address(this).balance
        }("");
        require(success, "Transfer failed.");
    }

    function setSalePrice(uint256 _price) external onlyOwner {
        price = _price;
    }

    function toggleSaleState() external onlyOwner {
        saleIsActive = !saleIsActive;
    }

    uint256[50] private __gap;
}
