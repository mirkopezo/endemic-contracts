import { BigInt } from '@graphprotocol/graph-ts';
import { ContractsCounts } from '../../../generated/schema';

function getContractsCount(contractAddress: string): ContractsCounts {
  let counts = ContractsCounts.load(contractAddress);

  if (counts == null) {
    counts = new ContractsCounts(contractAddress);
    counts.onSaleCount = BigInt.fromI32(0);
    counts.totalCount = BigInt.fromI32(0);
    counts.save();
  }

  return <ContractsCounts>counts;
}

export function updateContractCount(
  contractAddress: string,
  updateFn: (counts: ContractsCounts) => void
): void {
  let counts = getContractsCount(contractAddress);
  updateFn(counts);
  counts.save();
}
