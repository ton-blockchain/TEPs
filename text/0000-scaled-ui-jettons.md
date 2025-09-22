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

They MUST additionally (w.r.t. TEP-74) support the following get methods:
1. `get_supply_data()` returns `(int total_onchain_supply, int total_displayed_supply)`

   `total_onchain_supply` - (integer) - the sum of balances of jetton wallets of this jetton master (as reported by `get_wallet_data()` calls on the jetton wallets)

   `total_displayed_supply` - (integer) - the sum of balances presented to users in UIs. This value MUST NOT be 0 whenever `total_onchain_supply` is not 0.
2. `get_displayed_balance(int onchain_balance)` returns `int displayed_balance`

   `onchain_balance` - (integer) - the balance of a jetton wallet or a transfer amount as reported by `get_wallet_data()` call on the jetton wallet or in onchain data
   
   `displayed_balance` - (integer) - the equivalent amount that should be displayed in UIs
   
   In practice this get method SHOULD return the result of `muldiv(onchain_balance, total_displayed_supply, total_onchain_supply)`, unless `total_onchain_supply` is 0, in which case the method SHOULD return -1 to indicate data inconsistency.
3. `get_onchain_balance(int displayed_balance)` returns `int onchain_balance`

   `displayed_balance` - (integer) - the balance or transfer amount displayed or inputted in a UI
   
   `onchain_balance` - (integer) - the equivalent amount of onchain tokens
   
   In practice this get method SHOULD return the result of `muldiv(displayed_balance, total_onchain_supply, total_displayed_supply)`, unless `total_displayed_supply` is 0, in which case the method SHOULD return -1 to indicate data inconsistency.

# Drawbacks

TBD

# Rationale and alternatives

TBD

# Prior art

[Scaled UI Amount](https://solana.com/docs/tokens/extensions/scaled-ui-amount)

# Unresolved questions

TBD

# Future possibilities

TBD
