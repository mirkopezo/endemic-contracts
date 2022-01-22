// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/* --- Import new EndemicMultiChainNFT implementation --- */
import "./EndemicMultiChainNFT.sol";
/* --- Layer Zero imports --- */
import "../layer-zero/interfaces/ILayerZeroEndpoint.sol";
import "../layer-zero/interfaces/ILayerZeroReceiver.sol";

contract EndemicMultiChainNFTFactory is
    AccessControl,
    Pausable,
    ILayerZeroReceiver
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IBeacon public beacon;
    address marketplaceContract;
    /* --- Endpoint address --- */
    ILayerZeroEndpoint public endpoint;
    /* ---  Returns all created contracts by specific address (test only) --- */
    mapping(address => address[]) private ownerToTokens;

    constructor(
        IBeacon _beacon,
        address _marketplaceContract,
        address _endpoint
    ) {
        beacon = _beacon;
        marketplaceContract = _marketplaceContract;
        /* --- Initialize endpoint --- */
        endpoint = ILayerZeroEndpoint(_endpoint);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    event MultiChainNFTCreationInitiated(
        BeaconProxy indexed nftContract,
        uint16 indexed dstChainId,
        address indexed owner,
        string name,
        string symbol,
        string category
    );

    event MultiChainNFTCreated(
        BeaconProxy indexed nftContract,
        address indexed owner,
        string name,
        string symbol,
        string category
    );

    struct DeployParams {
        string name;
        string symbol;
        string category;
        string baseURI;
    }

    struct OwnedDeployParams {
        address owner;
        string name;
        string symbol;
        string category;
        string baseURI;
    }

    function createMultiChainTokenOnBothChains(
        uint16 _dstChainId,
        bytes calldata _dstEndemicNFTFactoryAddr,
        DeployParams calldata params
    ) external payable whenNotPaused onlyRole(MINTER_ROLE) {
        bytes memory data = abi.encodeWithSelector(
            EndemicMultiChainNFT(address(0))
                .__EndemicMultiChainNFT_init
                .selector,
            params.name,
            params.symbol,
            params.baseURI
        );

        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        EndemicMultiChainNFT endemicNft = EndemicMultiChainNFT(
            address(beaconProxy)
        );
        endemicNft.setDefaultApproval(marketplaceContract, true);
        endemicNft.setEndpointAddress(address(endpoint));
        endemicNft.transferOwnership(_msgSender());

        OwnedDeployParams memory paramsForLZ = OwnedDeployParams(
            _msgSender(),
            params.name,
            params.symbol,
            params.category,
            params.baseURI
        );

        bytes memory payload = abi.encode(address(beaconProxy), paramsForLZ);

        endpoint.send{value: msg.value}(
            _dstChainId,
            _dstEndemicNFTFactoryAddr,
            payload,
            payable(_msgSender()),
            address(0x0),
            bytes("")
        );

        /* --- For testing --- */ 
        address[] storage tokens = ownerToTokens[_msgSender()];
        tokens.push(address(beaconProxy));

        emit MultiChainNFTCreationInitiated(
            beaconProxy,
            _dstChainId,
            _msgSender(),
            params.name,
            params.symbol,
            params.category
        );
    }

    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external override {
        require(_msgSender() == address(endpoint), "only for endpoint");

        (address destAddr, OwnedDeployParams memory params) = abi.decode(
            _payload,
            (address, OwnedDeployParams)
        );

        bytes memory data = abi.encodeWithSelector(
            EndemicMultiChainNFT(address(0))
                .__EndemicMultiChainNFT_init
                .selector,
            params.name,
            params.symbol,
            params.baseURI
        );

        BeaconProxy beaconProxy = new BeaconProxy(address(beacon), data);
        EndemicMultiChainNFT endemicNft = EndemicMultiChainNFT(
            address(beaconProxy)
        );
        endemicNft.setDefaultApproval(marketplaceContract, true);
        endemicNft.setDestinationContractAddress(destAddr);
        endemicNft.setEndpointAddress(address(endpoint));
        endemicNft.transferOwnership(params.owner);

        /* --- For testing --- */ 
        address[] storage tokens = ownerToTokens[params.owner];
        tokens.push(address(beaconProxy));

        emit MultiChainNFTCreated(
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

    /* --- Getters for testing --- */

    function getMyTokens() external view returns (address[] memory) {
        return ownerToTokens[_msgSender()];
    }
}
