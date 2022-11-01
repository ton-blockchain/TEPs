- **TEP**: [62](https://github.com/ton-blockchain/TEPs/pull/2)
- **title**: NFT Standard
- **status**: Active
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK), [Tolya](https://github.com/tolya-yanot)
- **created**: 01.02.2022
- **replaces**: -
- **replaced by**: -

# Summary
A standard interface for non-fungible tokens.

# Motivation
A standard interface will greatly simplify interaction and display of different entities representing right of ownership.

NFT standard describes:

* The way of ownership changing.
* The way of association of items into collections.
* The way of deduplication of common part of collection.

# Guide
Non-Fungible Token (NFT) represents an ownership over unique digital asset (kitten images, title deeds, artworks, etc). Each separate token is an _NFT Item_. It is also convenient to gather NFT Items into an _NFT Collection_. In TON, each NFT Item and NFT Collection are separate smart contracts.

## NFT Metadata
_Main article_: TEP-64

Each NFT Item and NFT Collection itself has its own metadata (TEP-64). It contains some info about NFT, such as title and associated image. Metadata can be stored offchain (smart contract will contain only a link to json) or onchain (all data will be stored in smart contract).

Collection metadata example (offchain):
```json
{
   "image": "https://ton.org/_next/static/media/smart-challenge1.7210ca54.png",
   "name": "TON Smart Challenge #2",
   "description": "TON Smart Challenge #2 Winners Trophy",
   "social_links": []
}
```

Item metadata example (offchain):
```json
{
   "name": "TON Smart Challenge #2 Winners Trophy",
   "description": "TON Smart Challenge #2 Winners Trophy 1 place out of 181",
   "image": "https://ton.org/_next/static/media/duck.d936efd9.png",
   "content_url": "https://ton.org/_next/static/media/dimond_1_VP9.29bcaf8e.webm",
   "attributes": []
}
```

Offchain metadata is published for example on web. 

## Useful links
1. [Reference NFT implementation](https://github.com/ton-blockchain/token-contract/tree/main/nft)
2. [Getgems NFT contracts](https://github.com/getgems-io/nft-contracts)
3. [Toncli NFT scaffolding project](https://github.com/disintar/toncli/tree/master/src/toncli/projects/nft_collection) by Disintar
4. [TON NFT Deployer](https://github.com/tondiamonds/ton-nft-deployer)
5. FunC Lesson - NFT Standard ([en](https://github.com/romanovichim/TonFunClessons_Eng/blob/889424ae6a28453c4188ad65cdd9dbfeb750ecdb/10lesson/tenthlesson.md)/[ru](https://github.com/romanovichim/TonFunClessons_ru/blob/427037e7937f0e2e9caa4b866ee29f9d8e19b3c0/10lesson/tenthlesson.md))
6. [TON NFT Explorer](https://explorer.tonnft.tools/)

# Specification
The NFT collection and each NFT item are separate smart contracts.

Example: if you release a collection that contains 10 000 items, then you will deploy 10 001 smart contracts.

## NFT item smart contract
Must implement:

### Internal message handlers
### 1. `transfer`
**Request**

TL-B schema of inbound message:

`transfer#5fcc3d14 query_id:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell) forward_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell) = InternalMsgBody;`

`query_id` - arbitrary request number.

`new_owner` - address of the new owner of the NFT item.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message coins.

`custom_payload` - optional custom data.

`forward_amount` - the amount of nanotons to be sent to the new owner.

`forward_payload` - optional custom data that should be sent to the new owner.

**Should be rejected if:**

1. message is not from current owner.
2. there is no enough coins (with respect to NFT own storage fee guidelines) to process operation and send `forward_amount`.
3. After processing the request, the contract **must** send at least `in_msg_value - forward_amount - max_tx_gas_price` to the `response_destination` address.
   If the contract cannot guarantee this, it must immediately stop executing the request and throw error.
   `max_tx_gas_price` is the price in Toncoins of maximum transaction gas limit of NFT habitat workchain. For the basechain it can be obtained from [`ConfigParam 21`](https://github.com/ton-blockchain/ton/blob/78e72d3ef8f31706f30debaf97b0d9a2dfa35475/crypto/block/block.tlb#L660) from `gas_limit` field.

**Otherwise should do:**

1. change current owner of NFT to `new_owner` address.
2. if `forward_amount > 0` send message to `new_owner` address with `forward_amount` nanotons attached and with the following layout:
   TL-B schema: `ownership_assigned#05138d91 query_id:uint64 prev_owner:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.
   `forward_payload` should be equal with request's `forward_payload`.
   `prev_owner` is address of the previous owner of this NFT item.
   If `forward_amount` is equal to zero, notification message should not be sent.
3. Send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.

### `forward_payload` format

If you want to send a simple comment in the `forward_payload` then the `forward_payload` must starts with `0x00000000` (32-bits unsigned integer equals to zero) and the comment is contained in the remainder of the `forward_payload`.

If comment does not begin with the byte `0xff`, the comment is a text one; it can be displayed "as is" to the end user of a wallet (after filtering invalid and control characters and checking that it is a valid UTF-8 string).
For instance, users may indicate the purpose ("for coffee") of a simple transfer from their wallet to the wallet of another user in this text field.

On the other hand, if the comment begins with the byte `0xff`, the remainder is a "binary comment", which should not be displayed to the end user as text (only as hex dump if necessary).
The intended use of "binary comments" is, e.g., to contain a purchase identifier for payments in a store, to be automatically generated and processed by the store's software.

If the `forward_payload` contains a binary message for interacting with the destination smart contract (for example, with DEX), then there are no prefixes.

These rules are the same with the payload format when simply sending Toncoins from a regular wallet ([Smart Contract Guidelines: Internal Messages, 3](https://ton.org/docs/#/howto/smart-contract-guidelines?id=internal-messages)).

### 2 `get_static_data`
**Request**

TL-B schema of inbound message:

`get_static_data#2fcb26a2 query_id:uint64 = InternalMsgBody;`

`query_id` - arbitrary request number.

**should do:**

1. Send back message with the following layout and send-mode `64` (return msg amount except gas fees):
   TL-B schema: `report_static_data#8b771735 query_id:uint64 index:uint256 collection:MsgAddress = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.
   `index` - numerical index of this NFT in the collection, usually serial number of deployment.
   `collection` - address of the smart contract of the collection to which this NFT belongs.

### Get-methods
1. `get_nft_data()` returns `(int init?, int index, slice collection_address, slice owner_address, cell individual_content)`
   `init?` - if not zero, then this NFT is fully initialized and ready for interaction.
   `index` - numerical index of this NFT in the collection.  For collection-less NFT - arbitrary but constant value.
   `collection_address` - (MsgAddress) address of the smart contract of the collection to which this NFT belongs. For collection-less NFT this parameter should be addr_none;
   `owner_address` - (MsgAddress) address of the current owner of this NFT.
   `individual_content` - if NFT has collection - individual NFT content in any format;
   if NFT has no collection - NFT content in format that complies with standard [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md).

## NFT Collection smart contract
It is assumed that the smart contract of the collection deploys smart contracts of NFT items of this collection.

Must implement:

### Get-methods
1. `get_collection_data()` returns `(int next_item_index, cell collection_content, slice owner_address)`
   `next_item_index` - the count of currently deployed NFT items in collection. Generally, collection should issue NFT with sequential indexes (see Rationale(2) ). `-1` value of `next_item_index` is used to indicate non-sequential collections, such collections should provide their own way for index generation / item enumeration.
   `collection_content` - collection content in a format that complies with standard [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md).
   `owner_address` - collection owner address, zero address if no owner.
2. `get_nft_address_by_index(int index)` returns `slice address`
   Gets the serial number of the NFT item of this collection and returns the address (MsgAddress) of this NFT item smart contract.
3. `get_nft_content(int index, cell individual_content)` returns `cell full_content`
   Gets the serial number of the NFT item of this collection and the individual content of this NFT item and returns the full content of the NFT item in format that complies with standard [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md).
   As an example, if an NFT item stores a metadata URI in its content, then a collection smart contract can store a domain (e.g. "https://site.org/"), and an NFT item smart contract in its content will store only the individual part of the link (e.g "kind-cobra").
   In this example the `get_nft_content` method concatenates them and return "https://site.org/kind-cobra".

# Drawbacks
There is no way to get current owner of NFT onchain because TON is an asynchronous blockchain. When the message with info about NFT owner will be delivered, this info may become irrelevant, so we can't guarantee that current owner hasn't changed.

# Rationale and alternatives
1. "One NFT - one smart contract" simplifies fees calculation and allows to give gas-consumption guarantees.
2. NFT collection with sequential NFT index provide easy way of association and search of linked NFTs.
3. Division of NFT content into individual and common (collection) part allows to deduplicate storage as well as cheap mass update.

## Why not a single smart contract with a token_id -> owner_address dictionary?
1. Unpredictable gas consumption
   In TON, gas consumption for dictionary operations depends on exact set of keys.
   Also, TON is an asynchronous blockchain. This means that if you send a message to a smart contract, then you do not know how many messages from other users will reach the smart contract before your message.
   Thus, you do not know what the size of the dictionary will be at the moment when your message reaches the smart contract.
   This is OK with a simple wallet -> NFT smart contract interaction, but not acceptable with smart contract chains, e.g. wallet -> NFT smart contract -> auction -> NFT smart contract.
   If we cannot predict gas consumption, then a situation may occur like that the owner has changed on the NFT smart contract, but there were no enough Toncoins for the auction operation.
   Using smart contracts without dictionaries gives deterministic gas consumption.
2. Does not scale (becomes a bottleneck)
   Scaling in TON is based on the concept of sharding, i.e. automatic partitioning of the network into shardchains under load.
   The single big smart contract of the popular NFT contradicts this concept. In this case, many transactions will refer to one single smart contract.
   The TON architecture provides for sharded smart contracts(see whitepaper), but at the moment they are not implemented.

## Why are there no "Approvals"?
TON is an asynchronous blockchain, so some synchronous blockchain approaches are not suitable.

You cannot send the message "is there an approval?" because the response may become irrelevant while the response message is getting to you.

If a synchronous blockchain can check `alowance` and if everything is OK do `transferFrom` in one transaction, then in an asynchronous blockchain you will always need to send a `transferFrom` message at random, and in case of an error, catch the response message and perform rollback actions.

This is a complex and inappropriate approach.

Fortunately, all cases that arose during the discussion can be implemented by a regular transfer with notification of the new owner. In some cases, this will require an additional smart contract.

The case when you want to place NFT on several marketplaces at the same time is solved by creating auction smart contracts that first accept payment, and then NFT is sent to one of auction smart contracts.

## Why are there no obligatory royalties to the author from all sales?
In the process of developing this idea, we came to the conclusion that it is possible to guarantee royalties to the author from absolutely any sale on the blockchain only in 1 case:

All transfers must be carried out through an open long-term auction, and other types of transfers are prohibited.

If you want to transfer NFT to yourself to another wallet, then you need to start an auction and win it.

Another variation of this scheme is to make all transfers chargeable.

By prohibiting the free transfer of tokens, we make tokens inconvenient in many cases - the user simply updated the wallet, the user wants to donate NFT, the user wants to send NFT to some smart contract.

Given the poor usability and that NFTs are a general concept and not all of them are created for sale - this approach was rejected.

# Prior art
1. [Ethereum NFT Standard (EIP-721)](https://eips.ethereum.org/EIPS/eip-721)
2. [Polkadot NFT Standard (RMRK)](https://github.com/rmrk-team/rmrk-spec)
3. [Cosmos InterNFT Standards](https://github.com/interNFT/nft-rfc)
4. [Everscale NFT Standard (TIP-4.1)](https://docs.everscale.network/standard/TIP-4.1)

# Unresolved questions
1. Owner index is not implemented yet, should we implement it in future standards?
2. There is no standard methods to perform "safe transfer", which will revert ownership transfer in case of contract execution failure.

# Future possibilities
None

# Standard extensions
The functionality of the basic NFT standard can be extended:

* [NFTRoyalty](https://github.com/ton-blockchain/TEPs/blob/master/text/0066-nft-royalty-standard.md)
* [NFTBounceable (Draft)](https://github.com/ton-blockchain/TIPs/issues/67)
* [NFTEditable (Draft)](https://github.com/ton-blockchain/TIPs/issues/68)
* [NFTUpgradable (Draft)](https://github.com/ton-blockchain/TIPs/issues/69)

# TL-B schema
```
nothing$0 {X:Type} = Maybe X;
just$1 {X:Type} value:X = Maybe X;
left$0 {X:Type} {Y:Type} value:X = Either X Y;
right$1 {X:Type} {Y:Type} value:Y = Either X Y;
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8))
         = VarUInteger n;

addr_none$00 = MsgAddressExt;
addr_extern$01 len:(## 9) external_address:(bits len) 
             = MsgAddressExt;
anycast_info$_ depth:(#<= 30) { depth >= 1 }
   rewrite_pfx:(bits depth) = Anycast;
addr_std$10 anycast:(Maybe Anycast) 
   workchain_id:int8 address:bits256  = MsgAddressInt;
addr_var$11 anycast:(Maybe Anycast) addr_len:(## 9) 
   workchain_id:int32 address:(bits addr_len) = MsgAddressInt;
_ _:MsgAddressInt = MsgAddress;
_ _:MsgAddressExt = MsgAddress;

transfer query_id:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell)  forward_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)  = InternalMsgBody;

ownership_assigned query_id:uint64 prev_owner:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;

excesses query_id:uint64 = InternalMsgBody;
get_static_data query_id:uint64 = InternalMsgBody;
report_static_data query_id:uint64 index:uint256 collection:MsgAddress = InternalMsgBody;
```

Tags were calculated via tlbc as follows (request_flag is equal to `0x7fffffff` and response flag is equal to `0x80000000`):

`crc32('transfer query_id:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:Maybe ^Cell forward_amount:VarUInteger 16 forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x5fcc3d14 & 0x7fffffff = 0x5fcc3d14`

`crc32('ownership_assigned query_id:uint64 prev_owner:MsgAddress forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x85138d91 & 0x7fffffff = 0x05138d91 `

`crc32('excesses query_id:uint64 = InternalMsgBody') = 0x553276db | 0x80000000 = 0xd53276db`

`crc32('get_static_data query_id:uint64 = InternalMsgBody') = 0x2fcb26a2 & 0x7fffffff = 0x2fcb26a2`

`crc32('report_static_data query_id:uint64 index:uint256 collection:MsgAddress = InternalMsgBody') = 0xb771735 | 0x80000000 = 0x8b771735`

# Acknowledgements
We are grateful to the [Tonwhales](https://github.com/tonwhales) developers for collaborating on the current draft of the standard 🤝

# Changelog
[01 Feb 2022](https://github.com/ton-blockchain/TIPs/issues/62#issuecomment-1027167743) 

[02 Feb 2022](https://github.com/ton-blockchain/TIPs/issues/62#issuecomment-1028289413) 

[04 Feb 2022](https://github.com/ton-blockchain/TIPs/issues/64#issuecomment-1029767906) 

[08 Feb 2022](https://github.com/ton-blockchain/TIPs/issues/62#issuecomment-1032979666) 

[11 Feb 2022](https://github.com/ton-blockchain/TIPs/issues/62#issuecomment-1036003434) 

[30 Jul 2022](https://github.com/ton-blockchain/TIPs/issues/62#issuecomment-1200095572)

31 Aug 2022 - Added `forward_payload` format. 
