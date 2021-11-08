// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

interface MarketplaceInterface {
    function onLazyRedeemed(
        uint256 _tokenId,
        address _seller,
        address _buyer,
        uint256 _price
    ) external payable;
}
