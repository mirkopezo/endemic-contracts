import { Transfer } from '../../generated/templates/EndemicNFT/EndemicNFT';
import { TransferSingle } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import { Activity, NFT, Auction } from '../../generated/schema';
import { isMintEvent, isBurnEvent } from './nft';
import { Address, ethereum } from '@graphprotocol/graph-ts';

function getTransferActivityType(from: Address, to: Address): string {
  if (isMintEvent(from)) {
    return 'mint';
  } else if (isBurnEvent(to)) {
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
  activity.auctionTotalPrice = auction.totalPrice;
  activity.auctionStartingPrice = auction.startingPrice;
  activity.auctionSeller = auction.seller.toHexString();
  activity.auctionBuyer = auction.buyer;
  activity.type = type;
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.nft = nft.id;
  activity.nftTokenURI = nft.tokenURI;
  activity.nftImage = nft.image;
  activity.nftName = nft.name;

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
  activity.type = getTransferActivityType(event.params.from, event.params.to);
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
  activity.type = getTransferActivityType(event.params.from, event.params.to);
  activity.transferFrom = event.params.from.toHexString();
  activity.transferTo = event.params.to.toHexString();
  activity.createdAt = event.block.timestamp;
  activity.transactionHash = event.transaction.hash;
  activity.save();
}
