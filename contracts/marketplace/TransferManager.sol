// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../erc-721/IERC721.sol";
import "../erc-721/IEndemicMasterNFT.sol";

abstract contract TransferManager is OwnableUpgradeable {
    address claimEthAddress;
    uint256 masterNFTShares;
    IEndemicMasterNFT private masterNFT;

    function __TransferManager___init_unchained(
        address _claimEthAddress,
        IEndemicMasterNFT _masterNFT
    ) internal initializer {
        claimEthAddress = _claimEthAddress;
        masterNFT = _masterNFT;
    }

    function claimETH() external onlyOwner {
        uint256 claimableETH = address(this).balance - masterNFTShares;
        (bool success, ) = payable(claimEthAddress).call{value: claimableETH}(
            ""
        );
        require(success, "Transfer failed.");
    }

    function distributeMasterNFTShares() external onlyOwner {
        require(address(this).balance >= masterNFTShares, "Not enough funds");
        masterNFT.distributeShares{value: masterNFTShares}();
        masterNFTShares = 0;
    }

    function getAvailableMasterNftShares()
        external
        view
        onlyOwner
        returns (uint256)
    {
        return masterNFTShares;
    }

    function _transfer(
        address _owner,
        address _receiver,
        address _nftContract,
        uint256 _tokenId
    ) internal {
        IERC721(_nftContract).safeTransferFrom(_owner, _receiver, _tokenId);
    }

    uint256[50] private __gap;
}
