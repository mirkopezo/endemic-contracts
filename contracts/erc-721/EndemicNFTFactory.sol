// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

import "./EndemicNFT.sol";

/* --- Layer Zero imports --- */
import "../layer-zero/interfaces/ILayerZeroEndpoint.sol";
import "../layer-zero/interfaces/ILayerZeroReceiver.sol";

contract EndemicNFTFactory is AccessControl, Pausable, ILayerZeroReceiver {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IBeacon public beacon;
    address marketplaceContract;
    /* --- Endpoint address --- */
    ILayerZeroEndpoint public endpoint;
    /* ---  Added new state variables for testing --- */
    mapping(address => address[]) private ownerToTokens;

    constructor(
        IBeacon _beacon,
        address _marketplaceContract,
        address _endpoint
    ) {
        beacon = _beacon;
        marketplaceContract = _marketplaceContract;
        /* --- Init endpoint --- */
        endpoint = ILayerZeroEndpoint(_endpoint);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    event NFTContractCreated(
        BeaconProxy indexed nftContract,
        address indexed owner,
        string name,
        string symbol,
        string category
    );

    /* --- Add new event --- */

    event NFTCreationInitiated(
        uint16 indexed dstChainId,
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
        endemicNft.transferOwnership(_msgSender());

        emit NFTContractCreated(
            beaconProxy,
            _msgSender(),
            params.name,
            params.symbol,
            params.category
        );
    }

    function createTokenForOwner(OwnedDeployParams calldata params)
        external
        whenNotPaused
        onlyRole(DEFAULT_ADMIN_ROLE)
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

    /* --- New functions added - prototype --- */

    function createTokenOnOtherChain(
        uint16 _dstChainId,
        bytes calldata _dstEndemicNFTFactoryAddr,
        DeployParams calldata params
    ) external payable whenNotPaused onlyRole(MINTER_ROLE) {
        OwnedDeployParams memory paramsLZ = OwnedDeployParams(
            _msgSender(),
            params.name,
            params.symbol,
            params.category,
            params.baseURI
        );

        bytes memory payload = abi.encode(paramsLZ);

        endpoint.send{value: msg.value}(
            _dstChainId,
            _dstEndemicNFTFactoryAddr,
            payload,
            payable(_msgSender()),
            address(0x0),
            bytes("")
        );

        emit NFTCreationInitiated(
            _dstChainId,
            _msgSender(),
            params.name,
            params.symbol,
            params.category
        );
    }

    function createTokenOnThisChain(OwnedDeployParams memory params) private {
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

        address[] storage tokens = ownerToTokens[params.owner];
        tokens.push(address(beaconProxy));

        emit NFTContractCreated(
            beaconProxy,
            params.owner,
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
        require(_msgSender() == address(endpoint), "Only for endpoint");

        OwnedDeployParams memory params = abi.decode(
            _payload,
            (OwnedDeployParams)
        );

        createTokenOnThisChain(params);
    }

    /* --- Getters for testing --- */

    function getMyTokens() external view returns (address[] memory) {
        return ownerToTokens[_msgSender()];
    }
}
