- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Scaled UI Jettons
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Maxim Gromov](https://github.com/krigga)
- **created**: 19.09.2025
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for Jettons ([TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)) that allows for arbitrary scaling of the displayed balances.

# Motivation

Currently, it is not viable to implement jetton rebasing in any way, since updating the balances of all jetton wallets is not feasible due to TON's architecture. The alternative is scaled UI amounts, which this TEP proposes.

# Guide

TBD

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## Jetton Master contract extension

The jetton master contracts following this TEP are extended versions of [TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) jetton masters.

They MUST additionally (w.r.t. TEP-74) support the following get method:
1. `get_supply_data()` returns `(int total_onchain_supply, int total_displayed_supply)`

   `total_onchain_supply` - (integer) - the sum of balances of jetton wallets of this jetton master, that is, the same value as `total_supply` returned by `get_jetton_data()`

   `total_displayed_supply` - (integer) - the sum of balances presented to users in UIs. This value MUST NOT be 0 whenever `total_onchain_supply` is not 0.

The displayed (that is, the value presented to users in UIs supporting this TEP) balance of a jetton wallet MUST be calculated as `muldiv(onchain_balance, total_displayed_supply, total_onchain_supply)`, where `onchain_balance` is the balance of the jetton wallet as reported by `get_wallet_data()`, and `total_displayed_supply` and `total_onchain_supply` are the values returned by `get_supply_data()`.

Values inputted by users in UIs supporting this TEP have to be converted to onchain balance (the value used for sending jettons) as follows: `muldiv(displayed_or_inputted_balance, total_onchain_supply, total_displayed_supply)`, where `displayed_or_inputted_balance` is the value inputted by the user, and `total_onchain_supply` and `total_displayed_supply` are the values returned by `get_supply_data()`.

Jetton master contracts supporting this TEP MUST send the following external-out message (TL-B structure) whenever the values returned by `get_supply_data()` change (that includes the change of `total_supply` returned by `get_jetton_data()`, since `total_onchain_supply` is equal to `total_supply`):
```
supply_data_changed#d917e56f total_onchain_supply:(VarUInteger 32) total_displayed_supply:(VarUInteger 32) = ExternalOutMsgBody;
```

`total_onchain_supply` and `total_displayed_supply` in the external-out message MUST be the same values as returned by `get_supply_data()` after the transaction that sent the message.

`total_onchain_supply` and `total_displayed_supply` reported by `get_supply_data()` MUST NOT be changed between transactions that send the `supply_data_changed` message.

# Drawbacks

1. It is not possible to make a mechanism for calculating the displayed balance in a way that is different from the `muldiv` calculation using this TEP.

# Rationale and alternatives

## Why restrict the calculation to `muldiv` and why send the external-out message?

Both of these points significantly simplify the indexing of jettons that support this TEP by allowing indexers to:

1. Only store the multiplier reported by the jetton master contract and use it for displayed balance calculation for both present and historical data, on any reasonable number of jetton wallets.
2. Not have to call `get_supply_data()` after each transaction in order to obtain the new multiplier and instead rely on the external-out message.

# Prior art

[Scaled UI Amount](https://solana.com/docs/tokens/extensions/scaled-ui-amount)

# Unresolved questions

TBD

# Future possibilities

TBD
