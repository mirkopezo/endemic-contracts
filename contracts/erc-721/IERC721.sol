// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

interface IERC721 {
    function ownerOf(uint256 _tokenId) external view returns (address _owner);

    function approve(address _to, uint256 _tokenId) external;

    function getApproved(uint256 _tokenId) external view returns (address);

    function isApprovedForAll(address _owner, address _operator)
        external
        view
        returns (bool);

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) external;

    function supportsInterface(bytes4) external view returns (bool);

    function mint(
        address recipient,
        address artist,
        string calldata tokenURI
    ) external returns (bool);
}
