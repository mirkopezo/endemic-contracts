import { NFTContractCreated } from '../../generated/EndemicNFTFactory/EndemicNFTFactory';
import { EndemicNFT } from '../../generated/templates';
import { NFTContract } from '../../generated/schema';
import { createAccount } from '../modules/account';
import { incrementContractsCount } from '../modules/count';

export function handleNFTContractCreated(event: NFTContractCreated): void {
  let nftContract = NFTContract.load(event.params.nftContract.toHex());
  if (nftContract == null) {
    nftContract = new NFTContract(event.params.nftContract.toHex());
  }

  nftContract.name = event.params.name;
  nftContract.symbol = event.params.symbol;
  nftContract.category = event.params.category;
  nftContract.createdAt = event.block.timestamp;

  nftContract.save();

  EndemicNFT.create(event.params.nftContract);
  createAccount(event.params.owner);
  incrementContractsCount();
}
