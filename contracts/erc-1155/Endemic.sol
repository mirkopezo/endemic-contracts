// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.4;

// import "./ERC1155Base.sol";
// import "../roles/SignerRole.sol";

// contract Endemic is ERC1155Base, SignerRole {
//     event Mint(uint256 indexed tokenId, address artistId);

//     function __Endemic_init(string memory baseTokenURI, address defaultSigner)
//         external
//         initializer
//     {
//         __Context_init_unchained();
//         __ERC165_init_unchained();
//         __ERC721_init_unchained("Endemic", "END");
//         __ERC721Enumerable_init_unchained();
//         __ERC721URIStorage_init_unchained();
//         __ERC721Burnable_init_unchained();
//         __Ownable_init_unchained();

//         _setBaseURI(baseTokenURI);
//         _addSigner(defaultSigner);
//     }

//     function mint(
//         uint256 tokenId,
//         uint8 v,
//         bytes32 r,
//         bytes32 s,
//         string calldata tokenURI
//     ) external {
//         _requireOwnerSignature(tokenId, v, r, s);
//         _safeMint(_msgSender(), tokenId);
//         _setTokenURI(tokenId, tokenURI);

//         emit Mint(tokenId, _msgSender());
//     }

//     function _requireOwnerSignature(
//         uint256 tokenId,
//         uint8 v,
//         bytes32 r,
//         bytes32 s
//     ) private view {
//         bytes memory prefix = "\x19Ethereum Signed Message:\n32";
//         bytes32 prefixedProof = keccak256(
//             abi.encodePacked(
//                 prefix,
//                 keccak256(abi.encodePacked(address(this), tokenId))
//             )
//         );
//         require(
//             isSigner(ecrecover(prefixedProof, v, r, s)),
//             "Owner should sign tokenId"
//         );
//     }

//     uint256[50] private __gap;
// }
