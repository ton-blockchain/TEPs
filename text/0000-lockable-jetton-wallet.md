- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Lockable Jettons Wallets
- **status**: Draft
- **type**: Contract Interface
- **authors**: [KuznetsovNikita](https://github.com/KuznetsovNikita)
- **created**: 13.04.2023 
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggests extending the standard Jetton Wallet by adding the option `get_locked_balance` get method.

# Motivation

New contracts have may want to disable jetton transfer until a time in the future. For this case, the Jetton Wallet should show zero balance to not affect old services and add a new get method to allow to get a locked balance and expiration date.

The standard may use for:
1. Jetton DAO contract may want to disable jetton transfer until voting is in progress.
2. Jetton Vesting contract may want to release tokens in the future.


# Guide

Upon calling `get_locked_balance` get method Jetton Wallet should respond with integer jetton balance, integer jetton locked balance, and expiration date in integer UNIX epoch seconds format.

# Specification

## New Jetton Master contracts
An example of the implementation jetton wallet code can be found [here](https://github.com/OpenProduct/jetton-dao-contracts/blob/ece785f82e07a7833194992cfc0e2fa1a690b524/contracts/jetton_wallet.func#L367)


Jetton Wallet should implement the get method:

```
(int, int, int) get_locked_balance() method_id {
  (int balance, slice owner_address,
          slice jetton_master_address, cell jetton_wallet_code,
          int locked, int lock_expiration,
          cell vote_keeper_code) = load_data();
  return (balance, locked, lock_expiration);
}
```

# Drawbacks

The standard implies single expiration date single locked balance.

# Rationale and alternatives

This design allows us to show balance and locked balance in a user-friendly and clear format in blockchain explorers and wallets.

# Prior art

-

# Unresolved questions

-

# Future possibilities

-
