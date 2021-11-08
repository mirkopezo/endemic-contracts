const testnet_aurora = {
  endemicMasterKeyProxy: '0x79356B3928fB4729F1F4e472AbE9C5a5f7Cd07c2',
  endemicCollection: '0xcAfDB0E39edCe1b9c336EcFd27f6636c890fA295',
  endemicNftProxy: '0x521A502FE8BbE7865526DfB6EBCE92aB740200A8',
  endemicNftBeacon: '0x9680E47d863F5d5FEdEfeB2b5e161655df0c69b6',
  marketplaceProxy: '0xB59AFE0799d7936Da81b24ACF2D843D8309491e6',
  endemicNftFactory: '0x18F1Df65254eFc7031C30747de3D112B9E2A51B9',
  endemicErc20: '0x8F55D345458028d451C4f194E23c1B0150fa2567',
};

const networks = {
  testnet_aurora,
};

const getForNetwork = (network) => networks[network];

exports.getForNetwork = getForNetwork;
