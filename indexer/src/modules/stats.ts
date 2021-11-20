import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { Auction, CollectionStats, NFT } from '../../generated/schema';
import { isBurnEvent, isMintEvent } from './nft';

export function getOrCreateColectionStats(
  contractAddress: string
): CollectionStats {
  let stats = CollectionStats.load(contractAddress);

  if (!stats) {
    stats = new CollectionStats(contractAddress);
    stats.onSaleCount = BigInt.fromI32(0);
    stats.totalCount = BigInt.fromI32(0);
    stats.volumeTraded = BigInt.fromI32(0);
    stats.save();
  }

  return stats;
}

export function updateERC721StatsForTransfer(
  contractAddress: string,
  from: Address,
  to: Address
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);

  if (isMintEvent(from)) {
    collectionStats.totalCount = collectionStats.totalCount.plus(
      BigInt.fromI32(1)
    );
    collectionStats.save();
  } else if (isBurnEvent(to)) {
    collectionStats.totalCount = collectionStats.totalCount.minus(
      BigInt.fromI32(1)
    );
    collectionStats.save();
  }
}

export function updateERC1155StatsForTransfer(
  contractAddress: string,
  from: Address,
  to: Address,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);

  if (isMintEvent(from)) {
    collectionStats.totalCount = collectionStats.totalCount.plus(tokenAmount);
    collectionStats.save();
  } else if (isBurnEvent(to)) {
    collectionStats.totalCount = collectionStats.totalCount.minus(tokenAmount);
    collectionStats.save();
  }
}

export function updateStatsForAuctionCreate(
  contractAddress: string,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.plus(tokenAmount);
  collectionStats.save();
}

export function updateStatsForAuctionCancel(
  contractAddress: string,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.save();
}

export function updateStatsForAuctionCompleted(
  contractAddress: string,
  volumeTraded: BigInt,
  tokenAmount: BigInt
): void {
  let collectionStats = getOrCreateColectionStats(contractAddress);
  collectionStats.onSaleCount = collectionStats.onSaleCount.minus(tokenAmount);
  collectionStats.volumeTraded =
    collectionStats.volumeTraded.plus(volumeTraded);
  collectionStats.save();
}
