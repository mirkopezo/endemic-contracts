import { Address, BigInt } from '@graphprotocol/graph-ts';
import { NFTContract } from '../../../generated/schema';
import { EndemicNFT } from '../../../generated/templates/EndemicNFT/EndemicNFT';

export function createThirdPartyNFTContract(
  id: Address,
  createdAt: BigInt
): NFTContract {
  let nftContract = new NFTContract(id.toHexString());
  nftContract.category = getPredefinedCategory(id.toHexString());
  nftContract.createdAt = createdAt;

  let instance = EndemicNFT.bind(id);

  let name = instance.try_name();
  if (!name.reverted) {
    nftContract.name = name.value;
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    nftContract.symbol = symbol.value;
  }

  nftContract.save();

  return <NFTContract>nftContract;
}

export function getPredefinedCategory(id: string): string {
  // Todo
  return 'Collectibles';
  // switch (id) {
  //   case '0x7b404c05733344ea9a618b95b21ad27090b53456': // Art test
  //     return 'Collectibles';
  //   default:
  //     return '';
  // }
}
