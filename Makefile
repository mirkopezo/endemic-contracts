.PHONY: deployMasterKeysCollection
deployMasterKeysCollection:
	npx hardhat run scripts/erc-721/deploy-master-nft.js --network ${network}

.PHONY: deployInitialErc721
deployInitialErc721:
	npx hardhat run scripts/derc-721/eploy-erc721-initial.js --network ${network}

.PHONY: deployEndemicCollection
deployEndemicCollection:
	npx hardhat run scripts/erc-721/deploy-endemic-erc721.js --network ${network}

.PHONY: deployMarketplace
deployMarketplace:
	npx hardhat run scripts/marketplace/deploy-marketplace.js --network ${network}

.PHONY: deployBeacon
deployBeacon:
	npx hardhat run scripts/erc-721/deploy-beacon.js --network ${network}

.PHONY: deployFactory
deployFactory:
	npx hardhat run scripts/erc-721/deploy-nft-factory.js --network ${network}

.PHONY: upgradeErc721
upgradeErc721:
	npx hardhat run scripts/erc-721/upgrade-erc721-proxy.js --network ${network}

.PHONY: upgradeMarketplace
upgradeMarketplace:
	npx hardhat run scripts/marketplace/upgrade-marketplace-proxy.js --network ${network}

.PHONY: deployEndemicErc20
deployEndemicErc20:
	npx hardhat run scripts/erc-20/deploy-endemic-erc20.js --network ${network}

.PHONY: deployInitialERC1155
deployInitialERC1155:
	npx hardhat run scripts/erc-1155/deploy-erc1155-initial.js --network ${network}

.PHONY: deployERC1155Beacon
deployERC1155Beacon:
	npx hardhat run scripts/erc-1155/deploy-erc1155-beacon.js --network ${network}

.PHONY: deployERC1155Factory
deployERC1155Factory:
	npx hardhat run scripts/erc-1155/deploy-erc1155-factory.js --network ${network}