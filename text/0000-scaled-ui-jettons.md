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
1. `get_display_multiplier()` returns `(int numerator, int denominator)`

   `numerator` - (integer) - the numerator to be used when calculating displayed amounts from onchain amounts. MUST NOT be `0`.

   `denominator` - (integer) - the denominator to be used when calculating displayed amounts from onchain amounts. MUST NOT be `0`.

The displayed (that is, the value presented to users in UIs supporting this TEP) balance of a jetton wallet MUST be calculated as `muldiv(onchain_balance, numerator, denominator)`, where `onchain_balance` is the balance of the jetton wallet as reported by `get_wallet_data()`, and `numerator` and `denominator` are the values returned by `get_display_multiplier()`. The displayed balance calculated in such a way and presented to the user MUST still respect the `decimals` reported by jetton's metadata. Similarly, the total displayed supply MUST be calculated as `muldiv(total_onchain_supply, numerator, denominator)`.

Values inputted by users in UIs supporting this TEP have to be converted to onchain balance (the value used for sending jettons) as follows: `muldiv(displayed_or_inputted_balance, denominator, numerator)`, where `displayed_or_inputted_balance` is the value inputted by the user, and `numerator` and `denominator` are the values returned by `get_display_multiplier()`.

Jetton master contracts supporting this TEP MUST send the following external-out message (TL-B structure) whenever the values returned by `get_display_multiplier()`:
```
display_multiplier_changed#ac392598 numerator:(VarUInteger 32) denominator:(VarUInteger 32) {n:#} comment:(Maybe (SnakeData ~n)) = ExternalOutMsgBody;
```

`numerator` and `denominator` in the external-out message MUST be the same values as returned by `get_display_multiplier()` after the transaction that sent the message.

`numerator` and `denominator` reported by `get_display_multiplier()` MUST NOT be changed between transactions that send the `display_multiplier_changed` message.

`comment` is an optional field that may be used to describe the reason for the change of `numerator` and `denominator`. `SnakeData` is described in [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#data-serialization).

# Drawbacks

1. It is not possible to make a mechanism for calculating the displayed balance in a way that is different from the `muldiv` calculation using this TEP.

# Rationale and alternatives

## Why restrict the calculation to `muldiv` and why send the external-out message?

Both of these points significantly simplify the indexing of jettons that support this TEP by allowing indexers to:

1. Only store the multiplier reported by the jetton master contract and use it for displayed balance calculation for both present and historical data, on any reasonable number of jetton wallets.
2. Not have to call `get_display_multiplier()` after each transaction in order to obtain the new multiplier and instead rely on the external-out message.

# Prior art

[Scaled UI Amount](https://solana.com/docs/tokens/extensions/scaled-ui-amount)

# Unresolved questions

TBD

# Future possibilities

TBD
