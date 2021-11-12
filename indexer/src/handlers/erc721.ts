import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  Mint,
} from '../../generated/templates/EndemicNFT/EndemicNFT';

import { NFT, NFTContract, NFTBalance } from '../../generated/schema';
import {
  getERC721TokenURI,
  getNFTId,
  getNFTBalanceId,
  isERC721BurnEvent,
  readTokenMetadataFromIPFS,
  isERC721MintEvent,
} from '../modules/nft';
import { createAccount } from '../modules/account';
import { createERC721TransferActivity } from '../modules/activity';
import { createThirdPartyNFTContract } from '../modules/nftContract';
import { addContractCount, removeContractCount } from '../modules/count';

export function handleTransfer(event: Transfer): void {
  if (event.params.tokenId.toString() == '') {
    return;
  }

  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let tokenURI = getERC721TokenURI(event.address, event.params.tokenId);
  let nft = NFT.load(id);

  if (!nft) {
    nft = new NFT(id);
    nft.type = 'ERC-721';
  }

  let contract = NFTContract.load(event.address.toHexString());
  if (contract === null) {
    // Contract is not created via our factory, it's third party
    contract = createThirdPartyNFTContract(
      event.address,
      event.block.timestamp
    );
  }

  let nftBalanceId = getNFTBalanceId(id, event.params.to.toHexString());
  let nftBalance = NFTBalance.load(nftBalanceId);
  if (nftBalance === null) {
    nftBalance = new NFTBalance(nftBalanceId);
    nftBalance.account = event.params.to.toHexString();
    nftBalance.accountId = event.params.to;
    nftBalance.nft = id;
  }

  nftBalance.value = BigInt.fromI32(1);

  nft.tokenId = event.params.tokenId;
  nft.contract = event.address.toHexString();
  nft.updatedAt = event.block.timestamp;
  nft.currentPrice = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnAuction = false;
  nft.seller = null;

  if (isERC721MintEvent(event)) {
    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;

    addContractCount(
      event.address.toHexString(),
      BigInt.fromI32(1),
      BigInt.fromI32(0)
    );

    let metaData = readTokenMetadataFromIPFS(tokenURI);
    if (metaData !== null) {
      nft.image = metaData.image;
      nft.name = metaData.name;
      nft.description = metaData.description;
    } else {
      log.warning('TokenURI: {0} not available', [tokenURI]);
    }
  } else if (isERC721BurnEvent(event)) {
    nft.burned = true;
    removeContractCount(
      event.address.toHexString(),
      BigInt.fromI32(1),
      BigInt.fromI32(0)
    );
  }

  createAccount(event.params.to);

  nft.save();
  nftBalance.save();

  createERC721TransferActivity(nft, event);
}

export function handleMint(event: Mint): void {
  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let nft = <NFT>NFT.load(id);

  nft.artist = event.params.artistId.toHex();
  nft.artistId = event.params.artistId;

  nft.save();
}
