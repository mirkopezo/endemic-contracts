import { Transfer } from '../../../generated/templates/EndemicNFT/EndemicNFT';
import { Activity, NFT, Auction } from '../../../generated/schema';
import { isMintEvent, isBurnEvent } from '../nft';
import { Bytes, BigInt, ethereum } from '@graphprotocol/graph-ts';

function getTransferActivityType(event: Transfer): string {
  if (isMintEvent(event)) {
    return 'mint';
  } else if (isBurnEvent(event)) {
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
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftOwnerId = nft.ownerId;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = type;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}

export function createTransferActivity(nft: NFT, event: Transfer): void {
  let id =
    'transfer/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftOwnerId = nft.ownerId;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = getTransferActivityType(event);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}

export function createRedeemActivity(
  nft: NFT,
  seller: Bytes,
  price: BigInt,
  event: ethereum.Event
): void {
  let id = 'auction/' + event.transaction.hash.toHex() + event.logIndex.toHex();
  let activity = new Activity(id);
  activity.auctionPrice = price;
  activity.auctionSeller = seller.toHexString();
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftOwnerId = nft.ownerId;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;
  activity.type = 'auctionSuccess';
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}
