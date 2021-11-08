import { log, BigInt } from '@graphprotocol/graph-ts';
import {
  Transfer,
  Mint,
} from '../../generated/templates/EndemicNFT/EndemicNFT';

import { NFT, NFTContract } from '../../generated/schema';
import {
  getTokenURI,
  getNFTId,
  isMintEvent,
  isBurnEvent,
  readTokenMetadataFromIPFS,
} from '../modules/nft';
import { createAccount } from '../modules/account';
import { createTransferActivity } from '../modules/activity';
import { createThirdPartyNFTContract } from '../modules/nftContract';
import {
  incrementNftsCount,
  decrementNftsCount,
  updateContractCount,
} from '../modules/count';

export function handleTransfer(event: Transfer): void {
  if (event.params.tokenId.toString() == '') {
    return;
  }

  let id = getNFTId(
    event.address.toHexString(),
    event.params.tokenId.toString()
  );
  let tokenURI = getTokenURI(event);
  let nft = <NFT>NFT.load(id);

  if (!nft) {
    nft = new NFT(id);
  }

  let contract = NFTContract.load(event.address.toHexString());
  if (contract === null) {
    // Contract is not created via our factory, it's third party
    contract = createThirdPartyNFTContract(
      event.address,
      event.block.timestamp
    );
  }

  nft.tokenId = event.params.tokenId;
  nft.owner = event.params.to.toHex();
  nft.ownerId = event.params.to;
  nft.contract = event.address.toHex();
  nft.updatedAt = event.block.timestamp;
  nft.currentPrice = BigInt.fromI32(0);
  nft.burned = false;
  nft.isOnAuction = false;
  nft.seller = null;

  if (isMintEvent(event)) {
    nft.createdAt = event.block.timestamp;
    nft.category = contract.category;
    nft.contractId = event.address;
    nft.contractName = contract.name;
    nft.tokenURI = tokenURI;

    incrementNftsCount();
    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount += 1;
    });

    let metaData = readTokenMetadataFromIPFS(tokenURI);
    if (metaData !== null) {
      nft.image = metaData.get('image')
        ? metaData.get('image').toString()
        : null;
      nft.name = metaData.get('name') ? metaData.get('name').toString() : null;
      nft.description = metaData.get('description')
        ? metaData.get('description').toString()
        : null;
    } else {
      log.warning('TokenURI: {0} not available', [tokenURI]);
    }
  } else if (isBurnEvent(event)) {
    nft.burned = true;
    decrementNftsCount();
    updateContractCount(event.address.toHexString(), (counts) => {
      counts.totalCount -= 1;
    });
  }

  createAccount(event.params.to);

  nft.save();

  createTransferActivity(nft, event);
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
