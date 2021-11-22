// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../erc-721/IERC721.sol";
import "../erc-1155/IERC1155.sol";
import "../erc-721/IEndemicMasterNFT.sol";
import "../erc-20/IERC20.sol";
import "./LibAuction.sol";

abstract contract TransferManager is OwnableUpgradeable {
    address claimEthAddress;
    uint256 masterNFTShares;
    IEndemicMasterNFT private masterNFT;
    IERC20 private wrappedNEAR;

    function __TransferManager___init_unchained(
        address _claimEthAddress,
        IEndemicMasterNFT _masterNFT,
        IERC20 _wrappedNEAR
    ) internal initializer {
        claimEthAddress = _claimEthAddress;
        masterNFT = _masterNFT;
        wrappedNEAR = _wrappedNEAR;
    }

    // function claimFees() external onlyOwner {
    //     uint256 claimableETH = address(this).balance - masterNFTShares;
    //     (bool success, ) = payable(claimEthAddress).call{value: claimableETH}(
    //         ""
    //     );
    //     require(success, "Transfer failed.");
    // }

    // function distributeMasterNFTShares() external onlyOwner {
    //     require(address(this).balance >= masterNFTShares, "Not enough funds");
    //     masterNFT.distributeShares{value: masterNFTShares}();
    //     masterNFTShares = 0;
    // }

    function getAvailableMasterNftShares()
        external
        view
        onlyOwner
        returns (uint256)
    {
        return masterNFTShares;
    }

    function _transferWrappedNear(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(
            wrappedNEAR.transferFrom(_from, _to, _amount),
            "Transfer failed"
        );
    }

    function _transfer(
        address _owner,
        address _receiver,
        address _nftContract,
        uint256 _tokenId,
        uint256 _amount,
        bytes4 _assetClass
    ) internal {
        if (_assetClass == LibAuction.ERC721_ASSET_CLASS) {
            IERC721(_nftContract).safeTransferFrom(_owner, _receiver, _tokenId);
        } else if (_assetClass == LibAuction.ERC1155_ASSET_CLASS) {
            IERC1155(_nftContract).safeTransferFrom(
                _owner,
                _receiver,
                _tokenId,
                _amount,
                ""
            );
        } else {
            revert("Invalid asset class");
        }
    }

    uint256[50] private __gap;
}
