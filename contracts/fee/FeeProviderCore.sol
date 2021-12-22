// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";

import "../erc-721/IEndemicMasterNFT.sol";
import "../registry/IContractRegistry.sol";

abstract contract FeeProviderCore is PausableUpgradeable, OwnableUpgradeable {
    using AddressUpgradeable for address;

    uint256 public secondarySaleMakerFee;
    uint256 public takerFee;
    uint256 public initialSaleFee;
    uint256 public masterNftCut;

    mapping(address => mapping(uint256 => bool)) initialSales;

    IEndemicMasterNFT masterNFT;
    IContractRegistry contractRegistry;

    function __FeeProviderCore___init_unchained(
        uint256 _initialSaleFee,
        uint256 _secondarySaleMakerFee,
        uint256 _takerFee,
        uint256 _masterNftCut,
        IEndemicMasterNFT _masterNFT,
        IContractRegistry _contractRegistry
    ) internal initializer {
        initialSaleFee = _initialSaleFee;
        secondarySaleMakerFee = _secondarySaleMakerFee;
        takerFee = _takerFee;
        masterNftCut = _masterNftCut;
        masterNFT = _masterNFT;
        contractRegistry = _contractRegistry;
    }

    function updateFee(
        uint256 _secondarySaleMakerFee,
        uint256 _takerFee,
        uint256 _initialSaleFee,
        uint256 _masterNftCut
    ) external onlyOwner {
        require(_secondarySaleMakerFee <= 10000);
        require(_takerFee <= 10000);

        require(_initialSaleFee <= 10000);
        require(_masterNftCut <= 10000);

        takerFee = _takerFee;
        secondarySaleMakerFee = _secondarySaleMakerFee;
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

        bool isInitialSale = !initialSales[nftContract][tokenId];
        return isInitialSale ? initialSaleFee : secondarySaleMakerFee;
    }

    function getTakerFee(address buyer) public view returns (uint256) {
        require(buyer != address(0));

        if (_isAdressOwnerOfMasterNft(buyer)) {
            return 0;
        }

        return takerFee;
    }

    function onInitialSale(address nftContract, uint256 tokenId) external {
        require(
            contractRegistry.isSaleContract(_msgSender()),
            "Invalid caller"
        );
        initialSales[nftContract][tokenId] = true;
    }

    function getMasterNftCut() public view returns (uint256) {
        return masterNftCut;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _isAdressOwnerOfMasterNft(address _address)
        internal
        view
        returns (bool)
    {
        uint256 balance = masterNFT.balanceOf(_address);
        return balance > 0;
    }

    uint256[50] private __gap;
}
