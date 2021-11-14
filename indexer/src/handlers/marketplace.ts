import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
} from '../../generated/Marketplace/Marketplace';
import { NFT, Auction, NFTOwnership } from '../../generated/schema';
import {
  getNFTId,
  clearNFTAuctionProperties,
  addNFTAuctionProperties,
} from '../modules/nft';
import { createAuctionActivity } from '../modules/activity';
import * as auctionStatuses from '../data/auctionStatuses';
import { addContractCount, removeContractCount } from '../modules/count';
import { BigInt } from '@graphprotocol/graph-ts';
import { getNftOwnershipId } from '../modules/ownership';

export function handleAuctionCreated(event: AuctionCreated): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = NFT.load(nftId);
  if (nft === null) {
    return;
  }

  let auction = Auction.load(event.params.id.toHexString());
  if (auction == null || auction.status !== auctionStatuses.OPEN) {
    addContractCount(
      nft.contractId.toHexString(),
      BigInt.fromI32(0),
      event.params.amount
    );
  }

  if (auction == null) {
    auction = new Auction(event.params.id.toHexString());
  }

  auction.startedAt = event.block.timestamp;
  auction.seller = event.params.seller;
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.duration = event.params.duration;
  auction.status = auctionStatuses.OPEN;
  auction.nft = nftId;
  auction.tokenAmount = event.params.amount;
  auction.soldTokenAmount = BigInt.fromI32(0);

  auction.save();

  nft = addNFTAuctionProperties(nft, auction);
  nft.save();

  let ownershipId = getNftOwnershipId(nftId, event.params.seller.toHexString());
  let nftOwnership = NFTOwnership.load(ownershipId)!;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.save();

  createAuctionActivity(auction, nft, 'auctionCreate', event);
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toString());
  if (auction === null) {
    return;
  }

  let nft = <NFT>NFT.load(auction.nft);

  auction.soldAt = event.block.timestamp;
  auction.totalPrice = event.params.totalPrice;
  auction.buyer = event.params.winner;
  auction.soldTokenAmount = event.params.amount;
  auction.tokenAmount = auction.tokenAmount.minus(event.params.amount);

  if (auction.tokenAmount <= BigInt.fromI32(0)) {
    auction.status = auctionStatuses.SOLD;
    nft = clearNFTAuctionProperties(nft, auction);
    nft.save();
  }

  auction.save();

  let nftOwnership = NFTOwnership.load(
    getNftOwnershipId(nft.id, auction.seller.toHexString())
  )!;
  nftOwnership.nftPrice = BigInt.fromI32(0);
  nftOwnership.save();

  removeContractCount(
    nft.contractId.toHexString(),
    BigInt.fromI32(0),
    event.params.amount
  );

  createAuctionActivity(auction, nft, 'auctionSuccess', event);
}

export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auction = Auction.load(event.params.id.toString());
  if (auction === null) {
    return;
  }

  let nft = <NFT>NFT.load(auction.nft);

  auction.canceledAt = event.block.timestamp;
  auction.status = auctionStatuses.CANCELED;
  auction.save();

  nft = clearNFTAuctionProperties(nft, auction);
  nft.save();

  createAuctionActivity(auction, nft, 'auctionCancel', event);

  removeContractCount(
    nft.contractId.toHexString(),
    BigInt.fromI32(0),
    auction.tokenAmount
  );
}
