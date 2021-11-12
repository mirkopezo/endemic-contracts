import { log, ipfs, json, BigInt, Address } from '@graphprotocol/graph-ts';
import { Auction, NFT } from '../../../generated/schema';
import {
  Transfer,
  EndemicNFT,
} from '../../../generated/templates/EndemicNFT/EndemicNFT';
import { EndemicERC1155 } from '../../../generated/templates/EndemicERC1155/EndemicERC1155';
import * as addresses from '../../data/addresses';
import { Metadata } from './models';

export function isERC721MintEvent(event: Transfer): boolean {
  return event.params.from.toHexString() == addresses.Null;
}

export function isERC721BurnEvent(event: Transfer): boolean {
  return event.params.to.toHexString() == addresses.Null;
}

export function isERC1155MintEvent(from: Address): boolean {
  return from.toHexString() == addresses.Null;
}

export function isERC1155BurnEvent(to: Address): boolean {
  return to.toHexString() == addresses.Null;
}

export function getNFTId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}

export function getNFTOwnerId(nftId: string, accountAddress: string): string {
  return nftId + '-' + accountAddress;
}

export function getERC721TokenURI(address: Address, tokenId: BigInt): string {
  let erc721 = EndemicNFT.bind(address);
  let tokenURICallResult = erc721.try_tokenURI(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function getERC1155TokenURI(address: Address, tokenId: BigInt): string {
  let erc1155 = EndemicERC1155.bind(address);
  let tokenURICallResult = erc1155.try_uri(tokenId);

  let tokenURI = '';

  if (tokenURICallResult.reverted) {
    log.warning('tokenURI reverted for tokenID: {} contract: {}', [
      tokenId.toString(),
      address.toHexString(),
    ]);
  } else {
    tokenURI = tokenURICallResult.value;
  }

  return tokenURI;
}

export function readTokenMetadataFromIPFS(tokenURI: string): Metadata | null {
  if (!tokenURI) return null;

  let uriParts = tokenURI.split('/');
  if (!uriParts.length) return null;

  uriParts.splice(0, 2);
  let ipfsHash = uriParts.join('/');
  let bytes = ipfs.cat(ipfsHash);
  if (bytes !== null) {
    let data = json.fromBytes(bytes);
    if (data === null) {
      return null;
    }
    let metaData = data.toObject();
    if (metaData === null) {
      return null;
    }

    const image = metaData.get('image');
    const name = metaData.get('name');
    const description = metaData.get('description');

    return {
      image: image !== null ? image.toString() : null,
      name: name !== null ? name.toString() : null,
      description: description !== null ? description.toString() : null,
    };
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
