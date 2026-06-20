- **TEP**: [66](https://github.com/ton-blockchain/TEPs/pull/6)
- **title**: NFTRoyalty Standard Extension
- **status**: Active
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK), [Tolya](https://github.com/tolya-yanot)
- **created**: 12.02.2022
- **replaces**: -
- **replaced by**: -

# Summary

Extension for [NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md).

A standardized way to retrieve royalty payment information for non-fungible tokens (NFTs) to enable universal support for royalty payments across all NFT marketplaces and ecosystem participants.

# Motivation

It is convenient to standardize royalty, so all NFT markets will pay royalty to collection author independently of how this collection was deployed.

# Guide

1. report_royalty_params example implementation: [ton-blockchain/token-contract](https://github.com/ton-blockchain/token-contract/blob/2c13d3ef61ca4288293ad65bf0cfeaed83879b93/nft/nft-collection.fc#L58-L68).
2. get_royalty_params example implementation: [ton-blockchain/token-contract](https://github.com/ton-blockchain/token-contract/blob/2c13d3ef61ca4288293ad65bf0cfeaed83879b93/nft/nft-collection.fc#L149-L153).

Royalty data example in Fift:
```
"EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N" parse-smc-addr drop 2=: royalty-addr

<b
    11 16 u, // numerator
    1000 16 u, // denominator
    royalty-addr Addr, // address to send royalty
b> =: royalty-params
```

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

NFT Collection smart contract MUST implement:

(if this is a variant of NFT items without collection then NFT item smart contract MUST implement this).

#### Get-methods
1. `royalty_params()` returns `(int numerator, int denominator, slice destination)`
   Royalty share is `numerator / denominator`.
   E.g if `numerator = 11` and `denominator = 1000` then royalty share is `11 / 1000 * 100% = 1.1%`.
   `numerator` must be less `denominator`.
   `destination` - address to send royalty. Slice of type `MsgAddress`.

#### Internal messages
1. `get_royalty_params`
   **Request**
   TL-B schema of inbound message:
   `get_royalty_params#693d3950 query_id:uint64 = InternalMsgBody;`
   `query_id` - arbitrary request number.
   **Should do:**
   Send back message with the following layout and send-mode `64` (return msg amount except gas fees):
   TL-B schema `report_royalty_params#a8cb00ad query_id:uint64 numerator:uint16 denominator:uint16 destination:MsgAddress = InternalMsgBody;`

It is expected that marketplaces which want to participate in royalty payments will send `muldiv(price, numerator, denominator)` to `destination` address after NFT sale.

Marketplaces SHOULD neglect zero-value royalty payments.

Marketplaces MAY deduct gas and message fees required to send royalty from royalty amount.

## TL-B Schema
```
get_royalty_params query_id:uint64 = InternalMsgBody;
report_royalty_params query_id:uint64 numerator:uint16 denominator:uint16 destination:MsgAddress = InternalMsgBody;
```

`crc32('get_royalty_params query_id:uint64 = InternalMsgBody') = 0xe93d3950 & 0x7fffffff = 0x693d3950`

`crc32('report_royalty_params query_id:uint64 numerator:uint16 denominator:uint16 destination:MsgAddress = InternalMsgBody') = 0xa8cb00ad | 0x80000000 = 0xa8cb00ad`

# Drawbacks

There is no way to enforce royalty for each sale. There should be an option to gift NFT for free, however, it is not possible to track, was it really for free or not. See the relevant paragraph in [TEP-62](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#why-are-there-no-obligatory-royalties-to-the-author-from-all-sales).

# Rationale and alternatives

## Why can't I set a fixed amount of royalties?
We do not know in what currency the sale will take place. Percentage royalty is universal.

# Prior art

1. [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)

# Unresolved questions

1. Shall we standardize internal message with royalties which markets send to the author?

# Future possibilities

None
