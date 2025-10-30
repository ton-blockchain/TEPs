- **TEP**: [177](https://github.com/ton-blockchain/TEPs/pull/177)
- **title**: Mintless jettons
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Emelyanenko Kirill](https://github.com/EmelyanenkoK),  [Denis Subbotin](https://github.com/mr-tron)
- **created**: 7.07.2024
- **replaces**: -
- **replaced by**: -

# Summary

Extension for [Jetton](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) that allows merkle-proof airdrops with mint occuring on jetton-wallet contract in decentralised manner.
Support from wallet apps will allow to show not yet claimed jettons on balance and automatically claim on first outgoing transfer.

# Motivation

There is a need (to create large communities, big advertising campaigns, etc) for a type of Jettons that can be simultaneously airdropped to millions of users and being deployed on demand without large costs and significant additional load to blockchain.

# Guide

A straightforward way to achieve properties described in [Motivation](#motivation) is using [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree) - when airdrop amount for each user is stored in a leaf of the tree and can be "claimed" by owner by providing a small proof of its presence in the tree, and the jetton itself only needs to store a single hash for all items (not per item).

### Useful links

1. [Reference contract implementation](https://github.com/ton-community/mintless-jetton)
2. [Custom payload API](ttps://github.com/ton-blockchain/TEPs/blob/master/text/0000-jetton-offchain-payloads.md)

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.


## Contract

### Storage
In addition to standard fields (like balance, owner, etc), this standard suggest to store `merkle_hash` 256-bit integer in JettonMaster and JettonWallet contracts. Additionally all JettonWallet contracts stores flag `already_claimed` whether airdrop was claimed or not.

### Handlers

Standard TEP-74 Jetton implements the `transfer` handler with the following scheme:

```
transfer#0f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
                 response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                 forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
                 = InternalMsgBody;
```

This standard propose to use `custom_payload` to store there _claim airdrop_ command with the following scheme:
```
merkle_airdrop_claim#0df602d6 proof:^Cell = CustomPayload;
```

Where proof is _MerkleProof_ exotic cell of `Airdrop` structure with all unused branches pruned and the following scheme:

```
_ amount:Coins start_from:uint48 expired_at:uint48 = AirdropItem;

_ _(HashMap 267 AirdropItem) = Airdrop;
```

where 267-bit key is MsgAddressInt with `addr_std` constructor and empty `anycast`.


Upon receiving transfer command with attached `claim_airdrop` subcommand, jetton wallet checks:
* MerkleProof is valid and hash corresponds to stored merkle_hash
* whether airdrop is already claimed
* is now() between `start_from` and `expired_at`

then sets internal flag `already_claimed` to True and credits amount from AirdropItem.


After that standard transfer operation should be executed.

## Indexation and api

### Custom payload and indexation API

Described in [Jetton Offchain Payloads](https://github.com/ton-blockchain/TEPs/blob/master/text/0000-jetton-offchain-payloads.md) TEP.

###

In metadate stored according to [Metadata standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md) 
should be added field "mintles_merkle_dump_uri" with `string` type in json or `ContentData` type in TL-B:

`mintles_merkle_dump_uri` pointed to binary file contains BoC with merkle tree of all jettons wallets.

## GetMethods

Method `is_claimed()` for jetton wallets returns `bool` whether jetton is minted or not.
