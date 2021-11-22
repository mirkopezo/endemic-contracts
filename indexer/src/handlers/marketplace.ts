import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
} from '../../generated/Marketplace/Marketplace';
import { NFT, Auction } from '../../generated/schema';
import {
  getNFTId,
  handleAuctionCompletedForNFT,
  handleAuctionCreatedForNFT,
} from '../modules/nft';
import { createAuctionActivity } from '../modules/activity';
import * as collectionStats from '../modules/collectionStats';
import * as userStats from '../modules/userStats';
import { BigInt, store } from '@graphprotocol/graph-ts';
import { getOrCreateOwnership } from '../modules/ownership';

export function handleAuctionCreated(event: AuctionCreated): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = NFT.load(nftId)!;

  let auction = Auction.load(event.params.id.toHexString());
  if (!auction) {
    auction = new Auction(event.params.id.toHexString());
  } else {
    collectionStats.updateStatsForAuctionCancel(
      nft.contractId.toHexString(),
      auction.tokenAmount
    );
    userStats.updateStatsForAuctionCancel(
      event.params.seller.toHexString(),
      auction.tokenAmount
    );
  }

  auction.startedAt = event.block.timestamp;
  auction.seller = event.params.seller;
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.duration = event.params.duration;
  auction.nft = nftId;
  auction.tokenAmount = event.params.amount;
  auction.soldTokenAmount = BigInt.fromI32(0);

  auction.save();

  handleAuctionCreatedForNFT(nft, auction);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftPrice = nft.price;
  nftOwnership.nftIsOnSale = true;
  nftOwnership.save();

  collectionStats.updateStatsForAuctionCreate(
    nft.contractId.toHexString(),
    event.params.amount
  );
  userStats.updateStatsForAuctionCreate(
    event.params.seller.toHexString(),
    auction.tokenAmount
  );

  createAuctionActivity(auction, nft, 'auctionCreate', event);
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toHexString())!;
  let nft = NFT.load(auction.nft)!;

  auction.soldAt = event.block.timestamp;
  auction.buyer = event.params.winner;
  auction.soldTokenAmount = auction.soldTokenAmount.plus(event.params.amount);
  auction.tokenAmount = auction.tokenAmount.minus(event.params.amount);
  auction.totalPrice = event.params.totalPrice;
  auction.save();

  let isAuctionCompleted = auction.tokenAmount <= BigInt.fromI32(0);
  if (isAuctionCompleted) {
    store.remove('Auction', auction.id);
  }

  if (isAuctionCompleted) {
    handleAuctionCompletedForNFT(nft, auction.id);
    nft.lastSalePrice = auction.totalPrice;
    nft.save();
  }

  collectionStats.updateStatsForAuctionCompleted(
    nft.contractId.toHexString(),
    auction.totalPrice!,
    event.params.amount
  );

  userStats.updateStatsForAuctionCompleted(
    auction.buyer!.toHexString(),
    auction.seller.toHexString(),
    auction.totalPrice!,
    event.params.amount
  );

  createAuctionActivity(auction, nft, 'auctionSuccess', event);
}

export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auction = Auction.load(event.params.id.toHexString())!;
  store.remove('Auction', auction.id);

  let nft = NFT.load(auction.nft)!;
  handleAuctionCompletedForNFT(nft, auction.id);
  nft.save();

  let nftOwnership = getOrCreateOwnership(nft, auction.seller);
  nftOwnership.nftIsOnSale = false;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.save();

  createAuctionActivity(auction, nft, 'auctionCancel', event);

  collectionStats.updateStatsForAuctionCancel(
    nft.contractId.toHexString(),
    auction.tokenAmount
  );

  userStats.updateStatsForAuctionCancel(
    auction.seller.toHexString(),
    auction.tokenAmount
  );
}
