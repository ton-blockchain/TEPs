- **TEP**: [4907]
- **title**: Rental NFT, an Extension of TEP-62
- **status**: Draft
- **type**: Contract Interface
- **authors**: [luciferzxj](https://github.com/luciferzxj)https://github.com/sidebyandrew)
- **created**: 29.08.2024
- **replaces**: [TEP-62](https://github.com/ton-blockchain/TEPs/blob/master/0062-nft-standard.md)
- **replaced by**: -

# Summary

This standard is an extension of [TEP-62](https://github.com/ton-blockchain/TEPs/blob/master/0062-nft-standard.md). It proposes an additional role (`user`) which can be granted to addresses, and a time where the role is automatically revoked (`expires`). The `user` role represents permission to “use” the NFT, but not the ability to transfer it or set users.This protocol is inspired by ERC4907, so we also refer to this standard as TRC4907 protocol.

# Motivation

Some NFTs come with specific utilities. For instance, virtual land can be used to build environments, and NFTs representing game assets can be utilized within games. In some scenarios, the owner and the user of the NFT may not be the same individual. An NFT owner might rent out their asset to a different “user.” The actions a “user” can perform with the NFT should differ from those of the “owner” (for example, “users” typically shouldn’t have the ability to sell the NFT’s ownership). Therefore, it is sensible to establish separate roles that clearly define whether an address represents an “owner” or a “user,” and manage permissions accordingly.


# Guide

This standard differs from the basic NFT set in only the following ways:

- The user and expire variables need to be added to the contract.

- Add set_user message.
- The user and expire variables should also be added to the return value of the get_nft_data function.


# Specification

The keywords “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY” and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

Rental NFT implements [NFT Standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md) but with additional set_user operation:

TL-B schema of an internal message:

```func
set_user#b4cd6ce6 user:MsgAddress  expire:uint64 = InternalMsgBody;
```

Should be rejected if:

- Sender address is not an owner's address.

Otherwise should do:

- The values of the user and expire variables in the contract should be set to the incoming values for this message.

The get_nft_data function needs to determine whether the current user is expired or not, if it is expired then return zero address, otherwise return the current user address.In addition, the user and expire variables in the contract should be set to their default values in the transfer message logic.


# Drawbacks
Since the TRC4907 protocol may involve changes in user and expire state when a user transfers an NFT, the gas consumption will be a bit higher


# Rationale and alternatives

## Why do we need to set expire in nft item contract?
Applications of this model (such as renting) often demand that user addresses have only temporary access to using the NFT. Normally, this means the owner needs to submit two on-chain transactions, one to list a new address as the new user role at the start of the duration and one to reclaim the user role at the end. This is inefficient in both labor and gas, so an “expires” function is introduced to facilitate the automatic end of a usage term without needing a second transaction.

# Prior art
[Ethereum ERC4907 Sample implementation](https://github.com/ethereum/ERCs/blob/master/assets/erc-4907/contracts/ERC4907.sol)

# Unresolved questions

None

# Future possibilities

Standard looks finalized.