- **TEP**: [122](https://github.com/ton-blockchain/TEPs/pull/122)
- **title**: Onchain reveal mechanic
- **status**: Active
- **type**: Contract Interface
- **authors**: [Andrey Tvorozhkov](https://github.com/tvorogme)
- **created**: 31.10.2022
- **replaces**: -
- **replaced by**: -

# Summary

Extending the interface
of [non-fungible tokens](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md) with onchain
reveal mechanics

[Example of implementation with tests](https://github.com/disintar/nft-reveal)


# Motivation

Suppose you are a collection that wants to fairly reveal closed NFTs (already distributed) boxes among its users. Many
collections implement this through externel messages with NFT content updates (changing the content with the backend).
This does not give transparency to the process, you can trick users into putting up rare NFTs yourself, and users will
feel indignant about the lack of honesty.

The standard describes implementation examples as well as standard interfaces for a transparent NFT content update
process.

The standard itself does not guarantee the integrity of the NFT distribution, but only gives an example of it using
standard interfaces. The final implementation always depends on the specific product.

Examples described in this standard, can be improved to mathematically generate NFT without using external messages to
populate the pool for reveal.

A single interface will help developers of games, marketplaces and other dApps to display such mechanics in their
products.

# Guide

This standart was checked on 2 real NFT collections with >3k opened items on them. The standard itself does not set rigid boundaries, but it is easy to use, both for developers and users.

# Specification

### Collection side

NFT collection is extended by new GET method `get_reveal_data` that allow you to get information of remaining NFT
content that will be revealed.

dApps can parse such info and display to user what can be inside the mystery box.

Also dApps can detect can we reveal NFT or not right now (if there are 0 items left in collection - we can't reveal NFT)

Also collection is extended by new internal messages such: `nft_reveal_nft_request`
, `nft_reveal_success_collection_response` that allows to interact with NFT which is in reveal process.
And `collection_add_reveal_batch` which allow to extend current remaining list of content that will be raffle to NFTs

### NFT side

NFT item is extended by new GET method `get_reveal_mode` which means the current reveal status of this item.
Based on this, the dApp can show the possibility or progress of reveal

Also item is extended by new internal messages such: `nft_reveal_user_request` that allow user to ask NFT for reveal

# Specification

### TLB

```
nft_reveal_user_request#5fcc3d1a query_id:uint64 = InternalMsgBody;
nft_reveal_nft_request#5fcc3d1b query_id:uint64 index:uint256 = InternalMsgBody;
nft_reveal_success_collection_response#5fcc3d1c query_id:uint64 success:Bool new_content:(Maybe (Either Cell ^Cell))  = InternalMsgBody;

collection_add_reveal_batch#5fcc3d1d query_id:uint64 new_content_batch:Hashmap 64 Either Cell ^Cell = InternalMsgBody;
```

(crc tbd.)

### NFT Collection


### Internal message handlers

May implement:

---

`collection_add_reveal_batch#5fcc3d1d`

- `query_id` - arbitrary request number
- `new_content_batch` - hashmap with new content for reveal (index -> content)

**Should be rejected if:**

1. Sender address is not owner (for ordinary) or editor (for editable) of collection

**Otherwise, should:**
1. Add `new_content_batch` to storage, so NFTs could raffle new content from it

---
Must implement:


`nft_reveal_nft_request#5fcc3d1a`

- `query_id` - arbitrary request number
- `index` - index of NFT, which is doing this request

**Should be rejected if:**

1. Sender address is not NFT address with `index` from request (collection need to calculate NFT andress and check it)

**Otherwise, should:**

1. Send `nft_reveal_success_collection_response#5fcc3d1c` response to NFT item.
    - If reveal is success, must subtract from count of items that can be revealed and return  `success` - `true`
    - If `success` is `true` may return `new_content` Cell (NFT will use it to generate new content)
    - `query_id` in response must be the same value as present in `nft_reveal_nft_request#5fcc3d1a`

### Get method

`(int, cell) get_reveal_data()` with count of items that can be revealed (`-1`) if reveal is blocked forever, and dict
with content that will be raffled from (if possible)

---

### NFT Item

Must implement:

### Internal message handlers

---

`nft_reveal_user_request#5fcc3d1a`

- `query_id` - arbitrary request number

**Should be rejected if:**

1. Current `reveal_mode` is not `1`
2. Balance of message is less than `1000000` gas units * `gas_price` (1 TON with current configuration)

**Otherwise, should:**

1. Change `reveal_mode` to `2` (lock from other reveal requests)
2. Send `nft_reveal_nft_request#5fcc3d1a` to collection which is item from

---

`nft_reveal_success_collection_response#5fcc3d1c`

- `query_id` - arbitrary request number
- `success` - status of reveal process
- `new_content` - optional new content or content to generate new content from

**Should be rejected if:**

1. Sender address is not NFT collection address

**Otherwise, should:**

- If `success` is `true`
    1. Change `reveal_mode` to `3`
    2. If `new_content` is defined - should use it to generate new own NFT content
- If `sucess` is `false`
    1. Change `reveal_mode` to `1`

### Get method

`int get_reveal_mode()` - current reveal mode of item

- `0` - No lock, not revealed, can't reveal
- `1` - No lock, not revealed, can reveal
- `2` - Lock, not revealed
- `3` - Revealed


# Drawbacks

Why should we *not* do this?

# Rationale and alternatives

- Why is this design the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?

# Prior art
-

# Unresolved questions
-

# Future possibilities
- Use new TVM OPs for more complex onchain random
