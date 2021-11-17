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
import { addContractCount, removeContractCount } from '../modules/count';
import { BigInt, log, store } from '@graphprotocol/graph-ts';
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
    addContractCount(
      nft.contractId.toHexString(),
      BigInt.fromI32(0),
      event.params.amount
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
  nftOwnership.nftIsOnSale = nft.isOnSale;
  nftOwnership.save();

  createAuctionActivity(auction, nft, 'auctionCreate', event);
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toHexString())!;
  let nft = NFT.load(auction.nft)!;

  auction.soldAt = event.block.timestamp;
  auction.buyer = event.params.winner;
  auction.soldTokenAmount = auction.soldTokenAmount.plus(event.params.amount);
  auction.tokenAmount = auction.tokenAmount.minus(event.params.amount);
  auction.save();

  let isAuctionCompleted = auction.tokenAmount <= BigInt.fromI32(0);
  if (isAuctionCompleted) {
    store.remove('Auction', auction.id);
  }

  if (isAuctionCompleted) {
    handleAuctionCompletedForNFT(nft, auction.id);
    nft.save();
  }

  removeContractCount(
    nft.contractId.toHexString(),
    BigInt.fromI32(0),
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
  nftOwnership.nftIsOnSale = nft.isOnSale;
  nftOwnership.nftPrice = nft.price;
  nftOwnership.save();

  createAuctionActivity(auction, nft, 'auctionCancel', event);

  removeContractCount(
    nft.contractId.toHexString(),
    BigInt.fromI32(0),
    auction.tokenAmount
  );
}
