- **TEP**: 
- **title**: SFT (semi-fungible token) Standard
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Ivan Klimov](https://github.com/ivklim-ton-play) 
- **created**: 03.09.2022

# Summary

A standard interface for semi-fungible tokens(SFT). 

# Motivation
The idea is simple and seeks to create standard that can represent and control any number of fungible and non-fungible token types.

- The way of ownership changing.
- The way of association of similar items into collections.
- The way of tonkens transfers.
- The way of retrieving common information (name, circulating supply, etc) about given semi-fungible tokens asset.

# Guide

This standard is needed in the case when you need to issue a large number of identical NFTs, but the serial number is not important. For example, a membership card to access the site or the same items for games (100 red t-shirts, 100 yellow shorts, etc.). 

SFT represents ownership of a copy of a unique asset in a collection.

## SFT Metadata
Each SFT minter and SFT Collection itself has its own metadata ([TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)). It contains some info about SFT, such as title and associated image. Metadata can be stored offchain (smart contract will contain only a link to json) or onchain (all data will be stored in smart contract).

### SFT minter metadata example (offchain):
```json
{
   "name": "Huebel Bolt",
   "description": "Official token of the Huebel Company",
   "symbol": "BOLT",
   "decimals": 0,
   "image_data": "https://image.com/img.png",
   "sft": "true"
}
```
It extends the [Jettons metadata](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-attributes) by adding a `sft` object with `"true"`. Decimals is always 0.

### SFT collection metadata example (offchain):
```json
{
   "image": "https://image.com/img.png",
   "name": "Huebel Bolt collection",
   "description": "Official collection of the Huebel Company",
   "sft": "true"
}
```

It extends the [NFT collection metadata](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#nft-metadata-attributes) by adding a `sft` object with `"true"`.

Offchain metadata is published for example on web 

## Useful links
1. [Reference semi-fundable token implementation](https://github.com/ivklim-ton-play/ton-SFT)

# Specification

Here and following we use:
 - "SFT" - semi-fungible token. Almost the same as jetton from [Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) standart. However, the decimal number is always 0 and we only need add `sft` object to token metadata for [Jettons metadata](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-example-offchain). It leads to the logic that each token is undivided but fungible.
 - "SFT wallet" - wallet for semi-fungible tokens. Stores information about amount of SFTs owned by each user. Almost the same as jetton-wallets from [Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md). Smart-contracts called **"[sft-wallet](https://github.com/ivklim-ton-play/TEPs/blob/master/text/0084-sft-standart.md#sft-minter-smart-contract)"**.
 - "SFT minter" - minter of semi-fungible tokens. It stores one [Jettons metadata](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-example-offchain) with additional `sft` object for all SFTs that it minted. Contains all methods from [Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) (it is fully compatible with them). Contains some additional methods for the collection. Smart-contracts called **"[sft-minter](https://github.com/ivklim-ton-play/TEPs/blob/master/text/0084-sft-standart.md#sft-collection-smart-contract)"**.
 - "SFT collection" - collection for SFT minters. Each SFT minter has its own unique id. Based on the idea of [nft-collection](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md). Smart-contracts called **"[sft-collection](https://github.com/ivklim-ton-play/TEPs/blob/master/text/0084-sft-standart.md#sft-collection-smart-contract)"**.

### Example: 
You release a SFT-collection with circulating supply of 200 SFTs for id = 0, and circulating supply of 100 SFTs for id = 1.
- We have 2 owners.
  - Owner_1 has 100 SFTs by id = 0 and 100 by id = 1.
  - Owner_2 has 100 SFTs by id = 0.

We need to deploy 6 contracts: 
- **1** sft-collection smart-contract.
- **1** sft-minter smart-contract by id = 0 and **1** sft-minter smart-contract by id = 1.
- For owner_1 we need **1** sft-wallet smart-contract from sft-minter by id = 0 and **1** sft-wallet smart-contract from sft-minter by id = 1.
- For owner_2 we need **1** sft-wallet smart-contract from sft-minter by id = 0.

## SFT wallet smart contract
Must implement:

### Internal message handlers

#### 1. [`transfer` as in Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#1-transfer)

#### 2. [`burn` as in Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#2-burn)

### Get-methods
1. [**`get_wallet_data()`** as in Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#get-methods)

## SFT minter smart contract

Must implement:

### Internal message handlers

#### 1. [`transfer` as in NFT item smart contract](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#nft-item-smart-contract) 

#### 2. [`get_static_data` as in NFT item smart contract](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#2-get_static_data)

### Get-methods

1. [**`get_jetton_data()`** as in Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#get-methods-1) and `jetton_content` contains additional object `sft` ([offchain example](https://github.com/ivklim-ton-play/TEPs/blob/master/text/0084-sft-standart.md#sft-minter-metadata-example-offchain))

2. [**`get_wallet_address(slice owner_address)`** as in Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#get-methods-1)

3. `get_sft_collection_data()` returns `(int init?, int index, slice collection_address)` 

   `init?` - if not zero, then this SFT minter is fully initialized and ready for interaction

   `index` - (integer) - index in SFT collection
 
   `collection_address` - (MsgAddress) - address of the smart contract of the collection to which this SFT minter belongs. For collection-less SFT minter this parameter should be addr_none;
 
## SFT Collection smart contract
 
It is assumed that the smart contract of the collection deploys smart contracts of SFT minters of this collection.

Must implement:

### Get-methods
1. [**`get_collection_data()`** as in NFT Collection smart contract](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#get-methods-1) and content contains additional object `sft` ([offchain example](https://github.com/ivklim-ton-play/TEPs/blob/master/text/0084-sft-standart.md#sft-collection-metadata-example-offchain))

2. [**`get_nft_address_by_index(int index)`** as in NFT Collection smart contract](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#get-methods-1)

3. [**`get_nft_content(int index, cell individual_content)`** as in NFT Collection smart contract](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#get-methods-1)

# Drawbacks
There is no way to get current owner of SFT collection and SFT minter onchain because TON is an asynchronous blockchain. When the message with info about SFT owner will be delivered, this info may become irrelevant, so we can't guarantee that current owner hasn't changed.

There is no way to get actual wallet balance onchain, because when the message with balance will arrive, wallet balance may be not actual.

# Rationale 
Look in [NFT Rationale and alternatives](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#rationale-and-alternatives)

# Prior art
1. [Ethereum NFT Standard (EIP-1155)](https://eips.ethereum.org/EIPS/eip-1155)

# Unresolved questions

# Future possibilities

# TL-B schema

This TL-B SFT uses a combination of two other standards.

They both contain `transfer`, but it is important to consider the hash function when writing contracts.

1. [TL-B schema from Jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md#tl-b-schema)
`transfer` from Jettons need for sft wallet. 

2. [TL-B schema from NFT](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#tl-b-schema)
`transfer` from NFT belongs to the SFT minter.

# Changelog
[16 Sep 2022] The standard has been redesigned for greater compatibility with Jettons
[21 Sep 2022] Use "sft":"true" in metadata instead of "sft" : {}
[23 Sep 2022] For sft wallet use get_wallet_data()
