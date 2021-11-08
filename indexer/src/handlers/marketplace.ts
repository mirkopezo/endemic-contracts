import {
  AuctionCancelled,
  AuctionCreated,
  AuctionSuccessful,
  Redeem,
} from '../../generated/Marketplace/Marketplace';
import { NFT, Auction } from '../../generated/schema';
import {
  getNFTId,
  clearNFTAuctionProperties,
  addNFTAuctionProperties,
} from '../modules/nft';
import {
  createAuctionActivity,
  createRedeemActivity,
} from '../modules/activity';
import * as auctionStatuses from '../data/auctionStatuses';
import { incrementAuctionsCount, updateContractCount } from '../modules/count';

export function handleAuctionCreated(event: AuctionCreated): void {
  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = <NFT>NFT.load(nftId);
  if (nft === null) {
    return;
  }

  let auction = new Auction(event.params.id.toString());
  auction.startedAt = event.block.timestamp;
  auction.seller = event.params.seller;
  auction.startingPrice = event.params.startingPrice;
  auction.endingPrice = event.params.endingPrice;
  auction.duration = event.params.duration;
  auction.status = auctionStatuses.OPEN;
  auction.nft = nftId;

  auction.save();
  incrementAuctionsCount();
  updateContractCount(event.params.nftContract.toHexString(), (counts) => {
    counts.onSaleCount += 1;
  });

  nft = addNFTAuctionProperties(nft!, auction!);
  nft.save();

  createAuctionActivity(auction!, nft!, 'auctionCreate', event);
}

export function handleAuctionSuccessful(event: AuctionSuccessful): void {
  let auction = Auction.load(event.params.id.toString());
  if (auction === null) {
    return;
  }

  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = <NFT>NFT.load(nftId);

  auction.soldAt = event.block.timestamp;
  auction.totalPrice = event.params.totalPrice;
  auction.status = auctionStatuses.SOLD;
  auction.save();

  nft = clearNFTAuctionProperties(nft!);
  nft.save();

  createAuctionActivity(auction!, nft!, 'auctionSuccess', event);
  updateContractCount(event.params.nftContract.toHexString(), (counts) => {
    counts.onSaleCount -= 1;
  });
}

export function handleAuctionCancelled(event: AuctionCancelled): void {
  let auction = Auction.load(event.params.id.toString());
  if (auction === null) {
    return;
  }

  let nftId = getNFTId(
    event.params.nftContract.toHexString(),
    event.params.tokenId.toString()
  );

  let nft = <NFT>NFT.load(nftId);

  auction.canceledAt = event.block.timestamp;
  auction.status = auctionStatuses.CANCELED;
  auction.save();

  nft = clearNFTAuctionProperties(nft!);
  nft.save();

  createAuctionActivity(auction!, nft!, 'auctionCancel', event);
  updateContractCount(event.params.nftContract.toHexString(), (counts) => {
    counts.onSaleCount -= 1;
  });
}

export function handleRedeem(event: Redeem): void {
  let id = getNFTId(
    event.params.contractAddress.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = <NFT>NFT.load(id);

  nft.artist = event.params.artist.toHex();
  nft.artistId = event.params.artist;

  nft.save();

  createRedeemActivity(nft!, event.params.seller, event.params.minPrice, event);
}
