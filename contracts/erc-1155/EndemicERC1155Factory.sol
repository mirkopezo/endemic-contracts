// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "./EndemicERC1155.sol";

contract EndemicERC1155Factory is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IBeacon public beacon;
    address defaultSigner;
    address marketplaceContract;

    constructor(IBeacon _beacon, address _marketplaceContract) {
        beacon = _beacon;
        marketplaceContract = _marketplaceContract;

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    event NFTContractCreated(
        BeaconProxy indexed nftContract,
        address indexed owner,
        string name,
        string symbol,
        string category
    );

    struct DeployParams {
        address owner;
        string name;
        string symbol;
        string category;
        string baseURI;
    }

    function setMarketplaceContract(address _marketplaceContract)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        marketplaceContract = _marketplaceContract;
    }

    function createToken(DeployParams calldata params)
        external
        onlyRole(MINTER_ROLE)
    {
        bytes memory data = abi.encodeWithSelector(
            EndemicNFT(address(0)).__EndemicNFT_init.selector,
            params.name,
            params.symbol,
            params.baseURI
        );

        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        EndemicNFT endemicNft = EndemicNFT(address(beaconProxy));
        endemicNft.setDefaultApproval(marketplaceContract, true);
        endemicNft.transferOwnership(params.owner);

        emit NFTContractCreated(
            beaconProxy,
            params.owner,
            params.name,
            params.symbol,
            params.category
        );
    }
}
