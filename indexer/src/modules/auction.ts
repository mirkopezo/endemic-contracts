export function getAuctionId(contractAddress: string, tokenId: string): string {
  return contractAddress + '-' + tokenId;
}
