// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../erc-721/IEndemicMasterNFT.sol";

abstract contract FeeManager is OwnableUpgradeable {
    uint256 public makerFee;
    uint256 public initialSaleCut;
    uint256 public masterNftCut;
    IEndemicMasterNFT private masterNFT;

    mapping(address => mapping(uint256 => bool)) private _tradedTokens;
    uint256 public takerFee;

    function __FeeManager___init_unchained(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleCut,
        uint256 _masterNftCut,
        IEndemicMasterNFT _masterNFT
    ) internal initializer {
        makerFee = _makerFee;
        takerFee = _takerFee;
        initialSaleCut = _initialSaleCut;
        masterNftCut = _masterNftCut;
        masterNFT = _masterNFT;
    }

    function updateFee(
        uint256 _makerFee,
        uint256 _takerFee,
        uint256 _initialSaleCut,
        uint256 _masterNftCut
    ) external onlyOwner {
        require(_makerFee <= 10000);
        require(_takerFee <= 10000);
        require(_initialSaleCut <= 10000);
        require(_masterNftCut <= 10000);
        makerFee = _makerFee;
        takerFee = _takerFee;
        initialSaleCut = _initialSaleCut;
        masterNftCut = _masterNftCut;
    }

    function getMakerFee(
        address _seller,
        address _nftContract,
        uint256 _tokenId
    ) public view returns (uint256) {
        require(_seller != address(0));
        require(_nftContract != address(0));

        if (_isAdressOwnerOfMasterNFT(_seller)) {
            return 0;
        }

        bool isInitialSale = !_tradedTokens[_nftContract][_tokenId];
        return isInitialSale ? initialSaleCut : makerFee;
    }

    function getTakerFee(address _buyer) public view returns (uint256) {
        require(_buyer != address(0));
        if (_isAdressOwnerOfMasterNFT(_buyer)) {
            return 0;
        }

        return takerFee;
    }

    function _computeMakerCut(
        uint256 _price,
        address _seller,
        address _nftContract,
        uint256 _tokenId
    ) internal returns (uint256) {
        bool isInitialSale = !_tradedTokens[_nftContract][_tokenId];
        if (isInitialSale) {
            _tradedTokens[_nftContract][_tokenId] = true;
        }

        if (_isAdressOwnerOfMasterNFT(_seller)) {
            return 0;
        }

        uint256 makerCut = isInitialSale ? initialSaleCut : makerFee;

        return (_price * makerCut) / 10000;
    }

    function _computeTakerCut(uint256 _price, address _buyer)
        internal
        view
        returns (uint256)
    {
        if (_isAdressOwnerOfMasterNFT(_buyer)) {
            return 0;
        }

        return (_price * takerFee) / 10000;
    }

    function _isAdressOwnerOfMasterNFT(address _address)
        internal
        view
        returns (bool)
    {
        uint256 balance = masterNFT.balanceOf(_address);
        return balance > 0;
    }

    uint256[50] private __gap;
}
