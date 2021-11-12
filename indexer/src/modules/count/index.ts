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

export function addContractCount(
  contractAddress: string,
  totalValue: BigInt,
  saleValue: BigInt
): void {
  let counts = getContractsCount(contractAddress);
  counts.onSaleCount = counts.totalCount.plus(totalValue);
  counts.totalCount = counts.onSaleCount.plus(saleValue);
  counts.save();
}

export function removeContractCount(
  contractAddress: string,
  totalValue: BigInt,
  saleValue: BigInt
): void {
  let counts = getContractsCount(contractAddress);
  counts.onSaleCount = counts.totalCount.minus(totalValue);
  counts.totalCount = counts.onSaleCount.minus(saleValue);
  counts.save();
}
