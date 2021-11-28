// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./EndemicNFT.sol";

contract EndemicNFTFactory is AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IBeacon public beacon;
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
        whenNotPaused
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

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
