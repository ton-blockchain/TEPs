- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Destroyable NFT Standart
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Daniil Markov](https://github.com/arkadiystena)
- **created**: 10.12.2023
- **replaces**: -
- **replaced by**: -

# Summary

Extension for [NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md).

A standard interface for non-fungible tokens which allow to destroy them similar to [SBTs] (https://github.com/ton-blockchain/TEPs/blob/master/text/0085-sbt-standard.md#3-destroy). Destroyed NFTs looks like they were never minted, and there is no possibility to re-mint them

# Motivation

Sometimes people want to get rid of an NFT in their wallet, but don't want to sell or gift it to anyone (for example, if the creator of NFT collection accidentally minted an extra NFT), and the only thing they can do is to send the NFT to a zero address. However, this solution has two problems:
* Sending an NFT to a zero address is a loss for the user (a gas fee must be paid and the balance of the NFT smart contract cannot be withdrawn).
* Indexers will continue to display this NFT as if it belongs to some user, which means the displayed supply of the NFT collection could be reduced, even though no actions can be performed with this NFT anymore.

# Specification

Destroyable NFT implements [NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md) but with additional destroy operation:

TL-B schema of an internal message:
```
destroy#1f04537a query_id:uint64 = InternalMsgBody;
```
`query_id` -  arbitrary request number.

Should be rejected if:
* Sender address is not an owner's address.

Otherwise should do:
 * Should remove owner's address and nft content from contract storage (make NFT uninitialized like it wasn't minted).
 * Set collection address to null so NFT can't be minted again
 * Send message to sender with schema `excesses#d53276db query_id:uint64 = InternalMsgBody;` that will pass contract's balance amount.

### Implementation example
https://github.com/ArkadiyStena/nft-destroyable/blob/master/nft-destroyable.fc

# Guide
Mint can be done using basic NFT collection where nft-destroyable is an item. All operations are same with simple NFT besides destroy message.

# Drawbacks

TODO

# Rationale and alternatives

TODO

# Prior art

TODO

# Unresolved questions

TODO

# Future possibilities

Standard looks finalized.