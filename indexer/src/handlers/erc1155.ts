import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  TransferBatch,
  TransferSingle,
  Create,
} from '../../generated/templates/EndemicERC1155/EndemicERC1155';

import { NFT, NFTContract, NFTOwner } from '../../generated/schema';
import {
  getERC1155TokenURI,
  getNFTId,
  isERC1155BurnEvent,
  isERC1155MintEvent,
  readTokenMetadataFromIPFS,
  getNFTOwnerId,
} from '../modules/nft';
import { createAccount } from '../modules/account';
import { createERC1155TransferActivity } from '../modules/activity';
import { updateContractCount } from '../modules/count';

export function handleTransferSingle(event: TransferSingle): void {
  if (event.params.id.toString() == '') {
    return;
  }

  let id = getNFTId(event.address.toHexString(), event.params.id.toString());
  let nft = <NFT>NFT.load(id);

  let newOwnerId = getNFTOwnerId(id, event.params.to.toHexString());
  let newOwner = NFTOwner.load(newOwnerId);
  if (newOwner === null) {
    newOwner = new NFTOwner(newOwnerId);
    newOwner.account = event.params.to.toHexString();
  }
  newOwner.supply = newOwner.supply + event.params.value;
  newOwner.save();

  let oldOwnerId = getNFTOwnerId(id, event.params.from.toHexString());
  let oldOwner = NFTOwner.load(oldOwnerId);
  if (newOwner !== null) {
    oldOwner.supply = oldOwner.supply - event.params.value;
    oldOwner.save();
  }

  if (isERC1155MintEvent(event.params.from)) {
    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount = counts.totalCount + event.params.value;
    });
  } else if (isERC1155BurnEvent(event.params.to)) {
    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount = counts.totalCount - event.params.value;
    });
  }

  createAccount(event.params.to);
  createERC1155TransferActivity(nft, event);
}

export function handleCreate(event: Create): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = new NFT(id);
  let contract = NFTContract.load(event.address.toHexString());
  let tokenURI = getERC1155TokenURI(event.address, event.params.tokenId);

  nft.category = contract.category;
  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;

  nft.contract = event.address.toHexString();
  nft.contractId = event.address;
  nft.contractName = contract.name;

  nft.createdAt = event.block.timestamp;

  nft.tokenURI = tokenURI;
  nft.tokenId = event.params.tokenId;
  nft.supply = event.params.supply;

  nft.currentPrice = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnAuction = false;
  nft.seller = null;

  let metaData = readTokenMetadataFromIPFS(tokenURI);
  if (metaData !== null) {
    nft.image = metaData.image;
    nft.name = metaData.name;
    nft.description = metaData.description;
  } else {
    log.warning('TokenURI: {0} not available', [tokenURI]);
  }

  nft.save();
}
