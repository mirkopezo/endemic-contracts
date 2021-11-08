const { ethers } = require('hardhat');
const ProxyAdminJSON = require('@openzeppelin/upgrades-core/artifacts/ProxyAdmin.json');

const getProxyImpl = async (proxyAddress, network) => {
  const json = require(`../../.openzeppelin/${network}.json`);
  const proxyAdmin = await ethers.getContractAt(
    ProxyAdminJSON.abi,
    json.admin.address
  );
  return proxyAdmin.getProxyImplementation(proxyAddress);
};

exports.getProxyImpl = getProxyImpl;
