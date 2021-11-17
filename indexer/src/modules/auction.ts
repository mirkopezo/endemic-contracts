import { Address, BigInt, log, store } from '@graphprotocol/graph-ts';
import { Auction, NFT } from '../../generated/schema';
import { Marketplace } from '../../generated/Marketplace/Marketplace';
import { EndemicERC1155 } from '../../generated/templates/EndemicERC1155/EndemicERC1155';
import * as addresses from '../data/addresses';
import { handleAuctionCompletedForNFT } from './nft';

export function getAuctionId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}

export function updateRelatedAuction(
  nft: NFT,
  seller: Address,
  amount: BigInt
): void {
  let marketplace = Marketplace.bind(
    Address.fromString(addresses.EndemicMarketplace)
  );

  let auctionId = marketplace.try_createAuctionId(
    Address.fromString(nft.contractId.toHexString()),
    nft.tokenId,
    seller
  );
  if (auctionId.reverted) {
    return;
  }

  let auctionIdValue = auctionId.value.toHexString();
  let auction = Auction.load(auctionIdValue);
  if (auction == null) return;

  if (nft.type == 'ERC-1155') {
    let sellerBalance = EndemicERC1155.bind(
      Address.fromString(nft.contractId.toHexString())
    ).balanceOf(seller, nft.tokenId);

    let newBalance = sellerBalance.minus(amount);
    if (newBalance < auction.tokenAmount) {
      auction.tokenAmount = newBalance;
      if (auction.tokenAmount <= BigInt.fromI32(0)) {
        store.remove('Auction', auctionIdValue);
      } else {
        auction.save();
      }
    }
  } else {
    handleAuctionCompletedForNFT(nft, auctionIdValue);
    store.remove('Auction', auctionIdValue);
  }
}
