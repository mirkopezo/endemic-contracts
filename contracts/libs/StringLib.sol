// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library StringLib {
    function removeBaseURI(string memory _tokenURI, string memory _baseURI)
        internal
        pure
        returns (string memory)
    {
        uint256 lengthOfBaseURI = bytes(_baseURI).length;
        uint256 resultLength = bytes(_tokenURI).length - lengthOfBaseURI;
        bytes memory result = new bytes(resultLength);
        for (uint256 iter = 0; iter < resultLength; iter++) {
            result[iter] = bytes(_tokenURI)[iter + lengthOfBaseURI];
        }
        return string(result);
    }
}
