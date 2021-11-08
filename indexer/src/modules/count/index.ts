import { Counts, ContractsCounts } from '../../../generated/schema';
import * as countsId from '../../data/countId';

function getCount(): Counts {
  let counts = Counts.load(countsId.countId);

  if (counts == null) {
    counts = new Counts(countsId.countId);
    counts.nftsCount = 0;
    counts.nftContractsCount = 0;
    counts.nftAuctionsCount = 0;
    counts.save();
  }

  return <Counts>counts;
}

function getContractsCount(contractAddress: string): ContractsCounts {
  let counts = ContractsCounts.load(contractAddress);

  if (counts == null) {
    counts = new ContractsCounts(contractAddress);
    counts.onSaleCount = 0;
    counts.totalCount = 0;
    counts.save();
  }

  return <ContractsCounts>counts;
}

export function incrementContractsCount(): void {
  let counts = getCount();
  counts.nftContractsCount = counts.nftContractsCount + 1;
  counts.save();
}

export function incrementNftsCount(): void {
  let counts = getCount();
  counts.nftsCount = counts.nftsCount + 1;
  counts.save();
}

export function decrementNftsCount(): void {
  let counts = getCount();
  counts.nftsCount = counts.nftsCount - 1;
  counts.save();
}

export function incrementAuctionsCount(): void {
  let counts = getCount();
  counts.nftAuctionsCount = counts.nftAuctionsCount + 1;
  counts.save();
}

export function updateContractCount(
  contractAddress: string,
  updateFn: (counts: ContractsCounts) => void
): void {
  let counts = getContractsCount(contractAddress);
  updateFn(counts);
  counts.save();
}
