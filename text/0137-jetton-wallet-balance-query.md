- **TEP**: [137](https://github.com/ton-blockchain/TEPs/pull/137)
- **title**: Jetton Wallet Balance Query
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Ken](https://github.com/0kenx) [Microcosm Labs](https://github.com/microcosm-labs)
- **created**: 09.01.2024
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggests to extend standard Jetton wallet by adding mandatory onchain `get_balance` handler.

# Motivation

Sometimes a smart contract would like to query the balance of a Jetton wallet onchain. For example in situations where the smart contract knows that no outbound transfer can happen between the `get_balance` call and the `get_balance_response` reply (for example when a smart contract queries its own balance), the smart contract can know the minimum amount of Jetton tokens it holds.

# Guide

Upon receiving `get_balance` message, the Jetton wallet shall reply with message `get_balance_response` with its current balance.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## New Jetton contracts

Jetton wallet should handle message

`get_balance#312493a5 query_id:uint64 = InternalMsgBody;`

with TON amount higher than `5000 gas-units + msg_forward_prices.lump_price + msg_forward_prices.cell_price` = 0.0061 TON for current basechain settings attached. If the attached TON amount is not enough then throw an exception, otherwise reply with:

`get_balance_response#41cb4e49 query_id:uint64 balance:(VarUInteger 16) = InternalMsgBody;`

## Existing Jetton contracts

Existing Jetton contracts would not be able to comply with this standard.

## TL-B Schema

```tl-b
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8))
         = VarUInteger n;

get_balance query_id:uint64 = InternalMsgBody;
get_balance_response query_id:uint64 balance:VarUInteger 16 = InternalMsgBody;
```

`crc32('get_balance query_id:uint64 = InternalMsgBody') = 0x312493a5 & 0x7fffffff = 0x312493a5`

`crc32('get_balance_response query_id:uint64 balance:VarUInteger 16 = InternalMsgBody') = 0x41cb4e49 & 0x7fffffff = 0x41cb4e49`

# Drawbacks

New applications relying on this standard shall also add branch logic for already existing Jettons.

# Rationale and alternatives

Token standards of other asynchronous blockchains provide similar functions. This functionality cannot be achieved otherwise.

# Prior art

- [ICRC-1 Token Standard](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1)
- [Near Token Standard](https://nomicon.io/Standards/Tokens/FungibleToken/Core)

# Unresolved questions

None.

# Future possibilities

None.
