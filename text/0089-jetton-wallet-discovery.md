- **TEP**: [89](https://github.com/ton-blockchain/TEPs/pull/89)
- **title**: Discoverable Jettons Wallets
- **status**: Active
- **type**: Contract Interface
- **authors**: [sasha1618](https://github.com/sasha1618), [EmelyanenkoK](https://github.com/EmelyanenkoK) 
- **created**: 08.09.2022 
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggest to extend standard Jetton master by adding mandatory onchain `provide_wallet_address` handler.

# Motivation

Some application may want to be able to discover their or other contract wallets for some specific Jetton Master. For instance some contract may want to obtain and store it's jetton wallet for some Jetton to handle transfer notifications from it in specific way.

# Guide

Upon receiving `provide_wallet_address` message with address in question, Jetton Master should response with message containing address.

# Specification

## New Jetton Master contracts
Example of discoverable jetton minter code can be found [here](https://github.com/ton-blockchain/token-contract/blob/main/ft/jetton-minter-discoverable.fc)


Jetton Master should handle message

`provide_wallet_address#2c76b973 query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody;`

with TON amount higher than `5000 gas-units + msg_forward_prices.lump_price + msg_forward_prices.cell_price` = 0.0061 TON for current basechain settings (if amount is less than that it is not possible to send response) attached

and either throw an exception if amount of incoming value is not enough to calculate wallet address or
response with message (sent with mode 64)

`take_wallet_address#d1735400 query_id:uint64 wallet_address:MsgAddress owner_address:(Maybe ^MsgAddress) = InternalMsgBody;`

Note: if it is not possible to generate wallet address for address in question (for instance wrong workchain) `wallet_address` in `take_wallet_address` should be equal to `addr_none`. If `include_address` is set to `True`, `take_wallet_address` should include `owner_address` equal to `owner_address` in request (in other words response contains both owner address and associated jetton wallet address).

## Already existing Jetton Master contracts

Jettons with non-upgradable Jetton Master may spawn separate smart-contract (Jetton discovery) which implements this functionality. In this case pair of contracts (Jetton Master + Jetton Discovery) will behave the same way as new Jetton Master. For non-upgradable Jetton Master with updatable metadata it is recommended to add "wallet-discovery" key with value equal to text representaion of Jetton Discovery contract address.

## Scheme:
```
provide_wallet_address#2c76b973 query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody;
take_wallet_address#d1735400 query_id:uint64 wallet_address:MsgAddress owner_address:(Maybe ^MsgAddress) = InternalMsgBody;
```

```
crc32('provide_wallet_address query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody') = 2c76b973
crc32('take_wallet_address query_id:uint64 wallet_address:MsgAddress owner_address:Maybe ^MsgAddress = InternalMsgBody') = d1735400
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
