- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Compressed NFT Standard
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Maxim Gromov](https://github.com/krigga), [Narek Abovyan](https://github.com/naltox), [Ivan Nedzvetsky](https://github.com/stels-cs), [Daniil Sedov](https://github.com/Gusarich)
- **created**: 28.07.2023
- **replaces**: -
- **replaced by**: -

# Summary

Extension for [NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md).

A standard interface for non-fungible token collections which allow cheap mass creation of items/tokens.

# Motivation

There is a need (to create large communities, big advertising campaigns, etc) for a type of NFT collection which allows its authors/owners to create large amounts of items at low cost.

# Guide

A straightforward way to achieve properties described in [Motivation](#motivation) is using [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree) - then each item/token is a leaf of the tree and can be "claimed" by providing a small proof of its presence in the tree, and the collection itself only needs to store a single hash for all items (not per item).

### Useful links

1. [Reference contract implementation](https://github.com/ton-community/compressed-nft-contract)
2. [Reference augmenting API implementation](https://github.com/ton-community/compressed-nft-api)

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## Data types

### Item data
Item data is an object that completely represents a particular item. MUST include fields `metadata` (an object that MUST include fields `owner` - the address that will own the item once claimed; and `individual_content` - the individual content Cell that must be passed to the collection's `get_nft_content` get method; MAY include other fields) and `index` - the index of this particular item; MAY include other fields.

Example:
```json
{
	"metadata": {
		"owner": "0:0000000000000000000000000000000000000000000000000000000000000000", // raw address string
		"individual_content": "te6cckEBAQEAAgAAAEysuc0=" // base64 BoC serialized Cell
	},
	"index": "0" // number as a string
}
```

## Contract

NFT Collection smart contract MUST implement:

#### Get-methods
1. `get_nft_api_info()` returns `(int version, cell uri)`. `version` is the version of the API that augments this contract. This standard covers API version 1, see below for description. `uri` is the **final** (i.e. including any postfixes) root API URI in `SnakeText` format **without a trailing slash `/`**.

#### Internal messages
##### 1. `claim`
**Request**

TL-B schema of inbound message:
```tlb
claim#013a3ca6 query_id:uint64 item_index:uint256 proof:^Cell = InternalMsgBody;
```

`query_id` - arbitrary request number.

`item_index` - index of the item/token being claimed.

`proof` - proof data in implementation-defined format. Will usually be taken directly from the augmenting API.

**Should be rejected if:**
1. There are not enough coins attached to the message to process the operation and mint the item.
2. The attached proof data is invalid.

**Otherwise should do:**
1. Mint the item being claimed.

## Augmenting API version 1

Once a user has obtained and decoded the URI using the `get_nft_api_info` get method, verified the version (this standard covers version 1 only) and added the `/v1` postfix, they can use the following methods:

(`:arg` means an argument with name `arg`)

##### 1. `/items/:index`

Returns full information about a particular item including the proof Cell required to claim it.

MUST return a JSON object with the following fields:

| Name | Type | Description |
| --- | --- | ---|
| item | object | The item data serialized as a JSON object as discussed in the Item data section |
| proof_cell | string | The proof Cell that must be used in the `claim` request to claim this item. Serialized as base64 BoC |

Other fields MAY be returned.

Example:
```json
{
	"item": {
		"metadata": {
			"owner": "0:0000000000000000000000000000000000000000000000000000000000000000",
			"individual_content": "te6cckEBAQEACAAADDAuanNvbuTiyMU="
		},
		"index": "0"
	},
	"proof_cell": "te6cckEBBgEAeQACAAEDAUOAFa1KqA2Oswxbo4Rgh/q6NEaPLuK9o3fo1TFGn+MySjqQAgAMMi5qc29uAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQBQF4S3GMDJY/HoZd6TCREIOnCaYlF23hNzJaSsfMd1S7nBQAA8muEeQ=="
}
```

##### 2. `/items?offset=:offset&count=:count`

Returns information about multiple items at once.

API implementations MAY impose a limit on the `count` argument. If `count` exceeds the imposed limit, the API implementations MUST treat that request as if it had `count` set to the imposed limit, instead of the actual `count`.

MUST return a JSON object with the following fields:

| Name | Type | Description |
| --- | --- | --- |
| items | object[] | An array of at most `count` Item data objects or nulls (if there are gaps in the item list), the first one having the index `offset` |
| last_index | number | The index of the last item in the item list. Enumeration of items past this index cannot be done |

Other fields MAY be returned.

Example: (with `offset` 0, `count` 4, with the item list having an item index 0 and an item at an index greater than 3 with gaps in between)
```json
{
	"items": [
		{
			"metadata": {
				"owner": "0:0000000000000000000000000000000000000000000000000000000000000000",
				"individual_content": "te6cckEBAQEACAAADDAuanNvbuTiyMU="
			},
			"index": "0"
		},
		null,
		null,
		null
	],
	"last_index": "4"
}
```

##### 3. `/state`

Returns general information about this API instance.

MUST return a JSON object with the following fields:

| Name | Type | Description |
| --- | --- | --- |
| last_index | number | The index of the last item in the item list. Enumeration of items past this index cannot be done |
| address | string | The address of the collection smart contract that this API augments. Encoded as user-friendly url-safe address string |

Other fields MAY be returned.

Example:
```json
{
	"last_index": "0",
	"address": "0:0000000000000000000000000000000000000000000000000000000000000000"
}
```

# Drawbacks

1. The augmenting API is centralized
2. All items/tokens need to be "claimed" before they are actually present on-chain

# Rationale and alternatives

Most existing NFT Collection implementations have minting costs that scale at least linearly with the number of items to be minted, and this cost has to be spent all at once when minting these items. This design offers collection owners to create "virtual" items that need not be actually minted on-chain to exist before an action needs to be made with these items, therefore making the cost of collection creation (together with the items) constant, and offloading the real minting costs to the end users.

# Prior art

1. [Solana State Compression](https://docs.solana.com/learn/state-compression)

# Unresolved questions

Unknown

# Future possibilities

1. It is possible to decrease the costs even further by utilizing TVM-native special/exotic merkle proof Cells, but this was decided against during the creation of reference implementations for this standard because most modern wallets do not support sending special/exotic Cells.

# TL-B schema
```tlb
claim#013a3ca6 query_id:uint64 item_index:uint256 proof:^Cell = InternalMsgBody;

tail#_ {bn:#} b:(bits bn) = SnakeData ~0;
cons#_ {bn:#} {n:#} b:(bits bn) next:^(SnakeData ~n) = SnakeData ~(n + 1);

text#_ {n:#} data:(SnakeData ~n) = SnakeText;
```
