.PHONY: deployMasterKeysCollection
deployMasterKeysCollection:
	npx hardhat run scripts/deploy-master-nft.js --network ${network}

.PHONY: deployInitialErc721
deployInitialErc721:
	npx hardhat run scripts/deploy-erc721-initial.js --network ${network}

.PHONY: deployEndemicCollection
deployEndemicCollection:
	npx hardhat run scripts/deploy-endemic-erc721.js --network ${network}

.PHONY: deployMarketplace
deployMarketplace:
	npx hardhat run scripts/deploy-marketplace.js --network ${network}

.PHONY: deployBeacon
deployBeacon:
	npx hardhat run scripts/deploy-beacon.js --network ${network}

.PHONY: deployFactory
deployFactory:
	npx hardhat run scripts/deploy-nft-factory.js --network ${network}

.PHONY: upgradeErc721
upgradeErc721:
	npx hardhat run scripts/upgrade-erc721-proxy.js --network ${network}

.PHONY: upgradeMarketplace
upgradeMarketplace:
	npx hardhat run scripts/upgrade-marketplace-proxy.js --network ${network}

.PHONY: deployEndemicErc20
deployEndemicErc20:
	npx hardhat run scripts/deploy-endemic-erc20.js --network ${network}

.PHONY: deployEndemicVesting
deployEndemicVesting:
	npx hardhat run scripts/deploy-endemic-vesting.js --network ${network}


