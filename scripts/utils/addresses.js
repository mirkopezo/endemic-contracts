const aurora_testnet = {
  contractRegistryProxy: '0x1BE1744a1d718C1E42dA5BD1e79639Ae6DFbEb58',
  endemicMasterKeyProxy: '0x6D27C84EC245A7865718e1CDb7D1aE0EF4B6f08E',
  feeProviderProxy: '0xb00BB669eb0953144caE73cf4049F59B6d358203',
  endemicNftProxy: '0x599F825A6cBAdA1c8eB972F2ebb6780576d11B96',
  endemicCollection: '0x1F081B956f670D0fbf6d02b0439e802540bA1aBD',
  marketplaceProxy: '0xDd29A2E65c01B75d74A53a469bF90371697846BF',
  endemicNftBeacon: '0xaFf28326DB64f2f02a7788A047E525B047c0A525',
  endemicNftFactory: '0xFe7F3f28b5963b5447ECb37F1d9710f453BDFB21',
  bidProxy: '0x7CDdB0f2defc12205693454a6B6581702e3C7924',

  endemicErc20: '',

  endemicERC1155Proxy: '',
  endemicERC1155Beacon: '',
  endemicERC1155Factory: '',
};

const aurora = {
  contractRegistryProxy: '',
  endemicMasterKeyProxy: '0x97cb197f862173a0f4c0B9Fda3272b56464578cc',
  feeProviderProxy: '',
  endemicNftProxy: '0xCd75e540157E04b0a7f1E347d21dED2FF748AD0f',
  endemicCollection: '0x329b61bF16aDd14863c1C154614888F14303169c',
  endemicNftBeacon: '0xAfAF30cB1215e344088296e058c7694bAeBAe1E9',
  marketplaceProxy: '0xdC446d49c0055B48Ad6626FDf0F358396c8C0D06',
  endemicNftFactory: '0xf44F8a702945B1dc9819286D11E8cFce94d90Ef2',
  bidProxy: '0xf65D3A9820b2ceFf9289d9EACFc3aAB9bf00a935',

  endemicErc20: '',

  endemicERC1155Proxy: '',
  endemicERC1155Beacon: '',
  endemicERC1155Factory: '',
};

const networks = {
  aurora_testnet,
  aurora,
};

const getForNetwork = (network) => networks[network];

exports.getForNetwork = getForNetwork;
