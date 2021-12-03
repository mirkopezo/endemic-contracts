const aurora_testnet = {
  endemicMasterKeyProxy: '0x6D27C84EC245A7865718e1CDb7D1aE0EF4B6f08E',
  endemicNftProxy: '0x599F825A6cBAdA1c8eB972F2ebb6780576d11B96',
  endemicCollection: '0x1F081B956f670D0fbf6d02b0439e802540bA1aBD',
  marketplaceProxy: '0x45b87060571e9d372c0762497b6893374f3638Ee',
  endemicNftBeacon: '0xaFf28326DB64f2f02a7788A047E525B047c0A525',
  endemicNftFactory: '0xa5572e8558b2CCf6Cb7f05f04f3803dc577966F1',
  bidProxy: '0x6b144f36F83D49dc8c6CCe50a30A18651EC7DF88',

  endemicErc20: '',

  endemicERC1155Proxy: '',
  endemicERC1155Beacon: '',
  endemicERC1155Factory: '',
};

const aurora = {
  endemicMasterKeyProxy: '',
  endemicNftProxy: '',
  endemicCollection: '',
  endemicNftBeacon: '',
  marketplaceProxy: '',
  endemicNftFactory: '',
  bidProxy: '',

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
  bidProxy: '',

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
