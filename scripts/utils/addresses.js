const testnet_aurora = {
  endemicMasterKeyProxy: '0x79356B3928fB4729F1F4e472AbE9C5a5f7Cd07c2',
  endemicCollection: '0xcAfDB0E39edCe1b9c336EcFd27f6636c890fA295',
  endemicNftProxy: '0x521A502FE8BbE7865526DfB6EBCE92aB740200A8',
  endemicNftBeacon: '0x9680E47d863F5d5FEdEfeB2b5e161655df0c69b6',
  marketplaceProxy: '0x192A5Dc88b6d6e469EB701C305d14f188dF09644',
  endemicNftFactory: '0x18F1Df65254eFc7031C30747de3D112B9E2A51B9',
  endemicErc20: '0x8F55D345458028d451C4f194E23c1B0150fa2567',

  endemicERC1155Proxy: '',
  endemicERC1155Beacon: '',
  endemicERC1155Factory: '',
};

const rinkeby = {
  endemicMasterKeyProxy: '0xe999A36E49560D5596542B41503F04A383279e75',
  endemicNftProxy: '0x7a2Fe08968388486c368b0fF57eB36469fe9D11C',
  endemicNftBeacon: '0x8701876D0092CCE1A903B6b966C5deb52F7d086c',
  marketplaceProxy: '0xb5a6A16E9b6b98E40B88603800810C0b10f093e0',
  endemicNftFactory: '0xb7452f9838f8fe74ee63446F50C608480F1683c6',

  endemicERC1155Proxy: '0x55fbE3edd552e9711e51b479a6a66c11Ce52884e',
  endemicERC1155Beacon: '0x3a5Ca42770Ef7ebAa63bbd917d27AAe52E4aF58e',
  endemicERC1155Factory: '0x2c4ba617735b8ccab49CBf7eCC0a33fF8245bE86',
};

const networks = {
  testnet_aurora,
  rinkeby,
};

const getForNetwork = (network) => networks[network];

exports.getForNetwork = getForNetwork;
