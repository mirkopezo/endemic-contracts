import {
  log,
  ipfs,
  json,
  TypedMap,
  JSONValue,
  BigInt,
} from '@graphprotocol/graph-ts';
import { Auction, NFT } from '../../../generated/schema';
import {
  Transfer,
  EndemicNFT,
} from '../../../generated/templates/EndemicNFT/EndemicNFT';
import * as addresses from '../../data/addresses';

export function isMintEvent(event: Transfer): boolean {
  return event.params.from.toHexString() == addresses.Null;
}

export function isBurnEvent(event: Transfer): boolean {
  return event.params.to.toHexString() == addresses.Null;
}

export function getNFTId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}

export function getTokenURI(event: Transfer): string {
  let erc721 = EndemicNFT.bind(event.address);
  let tokenURICallResult = erc721.try_tokenURI(event.params.tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('tokenURI reverted for tokenID: {} contract: {}', [
      event.params.tokenId.toString(),
      event.address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function readTokenMetadataFromIPFS(
  tokenURI: string
): TypedMap<string, JSONValue> {
  if (!tokenURI) return null;

  let uriParts = tokenURI.split('/');
  if (!uriParts.length) return null;

  uriParts.splice(0, 2);
  let ipfsHash = uriParts.join('/');
  let bytes = ipfs.cat(ipfsHash);
  if (bytes !== null) {
    let data = json.fromBytes(bytes!);
    if (data === null) {
      return null;
    }
    return data.toObject();
  }

  return null;
}

export function addNFTAuctionProperties(nft: NFT, auction: Auction): NFT {
  nft.isOnAuction = true;
  nft.seller = auction.seller;
  // we only support immutable price for now. Starting and ending prices will always be the same in the contract
  nft.currentPrice = auction.startingPrice;
  return nft;
}

export function clearNFTAuctionProperties(nft: NFT): NFT {
  nft.isOnAuction = false;
  nft.seller = null;
  nft.currentPrice = BigInt.fromI32(0);
  return nft;
}
