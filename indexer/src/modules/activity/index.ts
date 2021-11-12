import { Transfer } from '../../../generated/templates/EndemicNFT/EndemicNFT';
import { TransferSingle } from '../../../generated/templates/EndemicERC1155/EndemicERC1155';
import { Activity, NFT, Auction } from '../../../generated/schema';
import {
  isERC721BurnEvent,
  isERC721MintEvent,
  isERC1155MintEvent,
  isERC1155BurnEvent,
} from '../nft';
import { ethereum } from '@graphprotocol/graph-ts';

function getERC721TransferActivityType(event: Transfer): string {
  if (isERC721MintEvent(event)) {
    return 'mint';
  } else if (isERC721BurnEvent(event)) {
    return 'burn';
  } else {
    return 'transfer';
  }
}

function getERC1155TransferActivityType(event: TransferSingle): string {
  if (isERC1155MintEvent(event.params.from)) {
    return 'mint';
  } else if (isERC1155BurnEvent(event.params.to)) {
    return 'burn';
  } else {
    return 'transfer';
  }
}

export function createAuctionActivity(
  auction: Auction,
  nft: NFT,
  type: string,
  event: ethereum.Event
): void {
  let id = 'auction/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.auction = auction.id;
  activity.auctionPrice = auction.startingPrice;
  activity.auctionSeller = auction.seller.toHexString();
  activity.auctionBuyer = auction.buyer;
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = type;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}

export function createERC721TransferActivity(nft: NFT, event: Transfer): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = getERC721TransferActivityType(event);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}

export function createERC1155TransferActivity(
  nft: NFT,
  event: TransferSingle
): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = getERC1155TransferActivityType(event);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}
