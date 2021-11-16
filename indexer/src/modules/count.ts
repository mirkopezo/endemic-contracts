import { BigInt } from '@graphprotocol/graph-ts';
import { ContractsCounts } from '../../generated/schema';

function getContractsCount(contractAddress: string): ContractsCounts {
  let counts = ContractsCounts.load(contractAddress);

  if (!counts) {
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
  counts.totalCount = counts.totalCount.plus(totalValue);
  counts.onSaleCount = counts.onSaleCount.plus(saleValue);
  counts.save();
}

export function removeContractCount(
  contractAddress: string,
  totalValue: BigInt,
  saleValue: BigInt
): void {
  let counts = getContractsCount(contractAddress);
  counts.totalCount = counts.totalCount.minus(totalValue);
  counts.onSaleCount = counts.onSaleCount.minus(saleValue);
  counts.save();
}
