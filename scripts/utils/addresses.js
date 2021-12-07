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
  endemicMasterKeyProxy: '0x97cb197f862173a0f4c0B9Fda3272b56464578cc',
  endemicNftProxy: '0xCd75e540157E04b0a7f1E347d21dED2FF748AD0f',
  endemicCollection: '0x329b61bF16aDd14863c1C154614888F14303169c',
  endemicNftBeacon: '0xAfAF30cB1215e344088296e058c7694bAeBAe1E9',
  marketplaceProxy: '0xdC446d49c0055B48Ad6626FDf0F358396c8C0D06',
  endemicNftFactory: '0xf44F8a702945B1dc9819286D11E8cFce94d90Ef2',
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
