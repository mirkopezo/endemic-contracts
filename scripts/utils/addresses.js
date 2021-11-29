const aurora_testnet = {
  endemicMasterKeyProxy: '0x79356B3928fB4729F1F4e472AbE9C5a5f7Cd07c2',
  endemicCollection: '0xcAfDB0E39edCe1b9c336EcFd27f6636c890fA295',
  endemicNftProxy: '0x8F27e6c9f6053c8CcB4Ed355724acD9e3b1dC262',
  endemicNftBeacon: '0x190FF6621404e1Ac72eE3F08AA3d88Dc5939a715',
  marketplaceProxy: '0x192A5Dc88b6d6e469EB701C305d14f188dF09644',
  endemicNftFactory: '0xBA2D5636A3EE2C0528D0B4385d57E97Cb64B16e6',
  endemicErc20: '0x8F55D345458028d451C4f194E23c1B0150fa2567',

  endemicERC1155Proxy: '',
  endemicERC1155Beacon: '',
  endemicERC1155Factory: '',
};

const aurora = {
  endemicMasterKeyProxy: '0x737De210b5b70de2f6A52af558120a36d3eE3067',
  endemicCollection: '',
  endemicNftProxy: '0x7f5C4AdeD107F66687E6E55dEe36A3A8FA3de030',
  endemicNftBeacon: '0xebF9D94516c2952B1bd9aA082f6bb5e402274C8f',
  marketplaceProxy: '0x11245523341e83558Db402a955ed7DF3320C1BF8',
  endemicNftFactory: '0x0b57A0eEA3b688BDcAc8FFb3bE6d549Ea7561D7b',
  endemicErc20: '',

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
  aurora_testnet,
  aurora,
  rinkeby,
};

const getForNetwork = (network) => networks[network];

exports.getForNetwork = getForNetwork;
