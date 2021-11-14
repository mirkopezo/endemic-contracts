import { Address } from '@graphprotocol/graph-ts';
import { Account } from '../../generated/schema';

export function createAccount(id: Address): void {
  let account = Account.load(id.toHexString());

  if (account == null) {
    account = new Account(id.toHexString());
    account.address = id;
  }

  account.save();
}
