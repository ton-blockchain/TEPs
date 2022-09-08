- **TEP**: [89](https://github.com/ton-blockchain/TEPs/pull/89)
- **title**: Discoverable Jettons Wallets
- **status**: Draft
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK)
- **created**: 08.09.2022 
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggest to extend standard Jetton master by adding mandatory onchain `get_wallet_address` handler.

# Motivation

Some application may want to be able to discover their or other contract wallets for some specific Jetton Master. For instance DEX may want to spawn pair-contract based on Jetton master contracts (and thus calculable by users) and authenticate wallets for that pair.

# Guide

Upon receiving `get_wallet_address` message with address in question, Jetton Master should response with message containing address.

# Specification

## New Jetton Master contracts
Jettom Master should handle message

`get_wallet_address#418cbb4e query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody;`

and either throw an exception if amount of incoming value is not enough to calculate wallet address or
response with message (sent with mode 64)

`report_wallet_address#ad30f94a query_id:uint64 wallet_address:MsgAddress owner_address:(Maybe ^MsgAddress) = InternalMsgBody;`

Note: if it is not possible to generate wallet address for address in question (for instance wrong workchain) `wallet_address` in `report_wallet_address` should be equal to `addr_none`. If `include_address` is set to `True`, `report_wallet_address` should include `owner_address` equal to `owner_address` in request (in other words response contains both owner address and associated jetton wallet address).

## Already existing Jetton Master contracts

Jettons with non-upgradable Jetton Master may spawn separate smart-contract (Jetton discovery) which implements this functionality. In this case pair of contracts (Jetton Master + Jetton Discovery) will behave the same way as new Jetton Master. For non-upgradable Jetton Master with updatable metadata it is recommended to add "wallet-discovery" key with value equal to text representaion of Jetton Discovery contract address.

## Scheme:
```
get_wallet_address query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody;
report_wallet_address query_id:uint64 wallet_address:MsgAddress owner_address:(Maybe ^MsgAddress) = InternalMsgBody;
```

```
crc32('get_wallet_address query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody') = 418cbb4e
crc32('report_wallet_address query_id:uint64 wallet_address:MsgAddress owner_address:Maybe ^MsgAddress = InternalMsgBody') = ad30f94a
```

# Drawbacks

If new applications start to heavily rely on these proposal without supporting separate Jetton Master/Jetton Discovery they may not be able to process already existing jettons.

# Rationale and alternatives

Currently it is expected that decentralised applications will work with specific wallets not with Jetton Masters. However sometimes it makes logic more complicated (especially if it is desired to create predictable contract addresses) or less straightforward for user-side checks.

# Prior art

-

# Unresolved questions

It is not possible to distinguish Jetton Discovery which consume higher than expected fee from non-Jetton Discovery contract.

# Future possibilities

-
