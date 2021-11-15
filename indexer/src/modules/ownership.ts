import { store, Bytes } from '@graphprotocol/graph-ts';
import { NFT, NFTOwnership } from '../../generated/schema';

export function getNftOwnershipId(
  nftId: string,
  accountAddress: string
): string {
  return nftId + '-' + accountAddress;
}

export function deleteOwnership(nftId: string, accountId: Bytes): void {
  let oldBalanceId = getNftOwnershipId(nftId, accountId.toHexString());
  store.remove('NFTOwnership', oldBalanceId);
}

export function getOrCreateOwnership(nft: NFT, accountId: Bytes): NFTOwnership {
  let nftOwnershipId = getNftOwnershipId(nft.id, accountId.toHexString());
  let nftOwnership = NFTOwnership.load(nftOwnershipId);
  if (!nftOwnership) {
    nftOwnership = new NFTOwnership(nftOwnershipId);
    nftOwnership.account = accountId.toHexString();
    nftOwnership.nft = nft.id;
    nftOwnership.nftCategory = nft.category;
    nftOwnership.nftPrice = nft.price;
    nftOwnership.nftContractId = nft.contractId;
    nftOwnership.nftBurned = nft.burned;
    nftOwnership.nftCreatedAt = nft.createdAt;
    nftOwnership.nftIsOnSale = nft.isOnSale;
  }

  return nftOwnership;
}
