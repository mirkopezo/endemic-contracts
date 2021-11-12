import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  TransferBatch,
  TransferSingle,
  Create,
} from '../../generated/templates/EndemicERC1155/EndemicERC1155';

import { NFT, NFTContract, NFTBalance } from '../../generated/schema';
import {
  getERC1155TokenURI,
  getNFTId,
  isERC1155BurnEvent,
  isERC1155MintEvent,
  readTokenMetadataFromIPFS,
  getNFTBalanceId,
} from '../modules/nft';
import { createAccount } from '../modules/account';
import { createERC1155TransferActivity } from '../modules/activity';
import { addContractCount, removeContractCount } from '../modules/count';

export function handleTransferSingle(event: TransferSingle): void {
  let nftId = getNFTId(event.address.toHexString(), event.params.id.toString());
  let nft = <NFT>NFT.load(nftId);

  let newBalanceId = getNFTBalanceId(nftId, event.params.to.toHexString());
  let newBalance = NFTBalance.load(newBalanceId);
  if (newBalance === null) {
    newBalance = new NFTBalance(newBalanceId);
    newBalance.account = event.params.to.toHexString();
    newBalance.accountId = event.params.to;
    newBalance.nft = nftId;
    newBalance.value = BigInt.fromI32(0);
  }
  newBalance.value = newBalance.value.plus(event.params.value);
  newBalance.save();

  let oldBalanceId = getNFTBalanceId(nftId, event.params.from.toHexString());
  let oldOwner = NFTBalance.load(oldBalanceId);
  if (oldOwner !== null) {
    oldOwner.value = oldOwner.value.minus(event.params.value);
    oldOwner.save();
  }
  if (isERC1155MintEvent(event.params.from)) {
    addContractCount(
      event.address.toHexString(),
      event.params.value,
      BigInt.fromI32(0)
    );
  } else if (isERC1155BurnEvent(event.params.to)) {
    removeContractCount(
      event.address.toHexString(),
      event.params.value,
      BigInt.fromI32(0)
    );
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
  if (contract === null) {
    log.warning('Contract: {0} not available', [event.address.toHexString()]);
    return;
  }

  let tokenURI = getERC1155TokenURI(event.address, event.params.tokenId);

  nft.type = 'ERC-1155';
  nft.category = contract.category;
  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;

  nft.contract = event.address.toHexString();
  nft.contractId = event.address;
  nft.contractName = contract.name;

  nft.createdAt = event.block.timestamp;
  nft.updatedAt = event.block.timestamp;

  nft.tokenURI = tokenURI;
  nft.tokenId = event.params.tokenId;
  nft.supply = event.params.supply;

  nft.currentPrice = BigInt.fromI32(0);
  nft.isOnAuction = false;
  nft.seller = null;
  nft.burned = false;

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
