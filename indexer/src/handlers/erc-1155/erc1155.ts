import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  TransferBatch,
  TransferSingle,
  Create,
} from '../../../generated/templates/EndemicERC1155/EndemicERC1155';

import { NFT, NFTContract, NFTOwner } from '../../../generated/schema';
import {
  getERC1155TokenURI,
  getNFTId,
  isERC1155BurnEvent,
  isERC1155MintEvent,
  readTokenMetadataFromIPFS,
  getNFTOwnerId,
} from '../../modules/nft';
import { createAccount } from '../../modules/account';
import { createERC1155TransferActivity } from '../../modules/activity';
import { updateContractCount } from '../../modules/count';

export function handleTransferSingle(event: TransferSingle): void {
  if (event.params.id.toString() == '') {
    return;
  }

  let id = getNFTId(event.address.toHexString(), event.params.id.toString());
  let tokenURI = getERC1155TokenURI(event.address, event.params.id);
  let nft = <NFT>NFT.load(id);

  if (!nft) {
    log.warning('NFT: {0} not available', [id]);
    return;
  }

  let contract = NFTContract.load(event.address.toHexString());

  let nftOwnerId = getNFTOwnerId(id, event.params.to.toHexString());
  let nftOwner = NFTOwner.load(nftOwnerId);
  if (nftOwner === null) {
    nftOwner = new NFTOwner(nftOwnerId);
  }

  nftOwner.supply = nftOwner.supply + event.params.value;
  nftOwner.account = event.params.to.toHexString();

  nft.tokenId = event.params.id;
  nft.contract = event.address.toHex();
  nft.updatedAt = event.block.timestamp;
  nft.currentPrice = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnAuction = false;
  nft.seller = null;

  if (isERC1155MintEvent(event.params.from)) {
    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;

    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount = counts.totalCount + event.params.value;
    });

    let metaData = readTokenMetadataFromIPFS(tokenURI);
    if (metaData !== null) {
      nft.image = metaData.image;
      nft.name = metaData.name;
      nft.description = metaData.description;
    } else {
      log.warning('TokenURI: {0} not available', [tokenURI]);
    }
  } else if (isERC1155BurnEvent(event.params.to)) {
    nft.burned = true;
    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount = counts.totalCount - event.params.value;
    });
  } else {
    let nftPreviousOwnerId = getNFTOwnerId(id, event.params.from.toHexString());
    let nftPreviousOwner = NFTOwner.load(nftPreviousOwnerId);
    nftPreviousOwner.supply = nftPreviousOwner.supply - event.params.value;
    nftPreviousOwner.save();
  }

  createAccount(event.params.to);

  nft.save();
  nftOwner.save();

  createERC1155TransferActivity(nft, event);
}

export function handleCreate(event: Create): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = new NFT(id);

  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;
  nft.supply = event.params.supply;

  nft.save();
}
