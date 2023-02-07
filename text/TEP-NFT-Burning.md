- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: TEP Template *(write title of TEP here)*
- **status**: Draft
- **type**: Meta / Core / Contract Interface *(choose one)*
- **authors**: [Vladimir Lebedev](https://github.com/hacker-volodya) *(replace)*
- **created**: DD.MM.YYYY *(fill with current date)*
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

This document introduces NFT Burning functionality.

# Motivation

When assets are bridged from "foreing" chains their wrapped copies are minted on the destination chain, for example, TON. 

Once such an NFT is sent to its original chain or to a third foreign chain it must be destroyed  to avoid:
1. Assets duplication and double spending
2. Displaying of non-existant or non-operable tokens by Marketplaces and explorers
3. Keeping irrelevant data on the chain storage increasing the size of its nodes

# Guide

A contract with the NFT MUST be destroyed and all the records of this NFT in the collection smart contract MUST be removed or replaces with NULL values.

Alternatively, an asset can be marked as BURNED and filtered by the Marketplaces & explorers, however, it won't solve the 3rd problem described above and thus, can only surve as a temporary solution.

# Specification

This section describes your feature formally. It contains requirements, which must be followed in order to implement your TEP. To keep things formal, it is convenient to follow [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt). You should include following text at the beginning of this section:

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

# Drawbacks

1. Burning can be executed by malicious actors and thus, SHOULD be protected by security mechanisms.
2. Chain history can become inconsistent if BURNING is not done the right way. Burning transactions SHOULD be stored on the chain alongside the minting and transferring ones.

# Rationale and alternatives
 
- Since the only existing alternative is sending the tokens to some smart contract or address "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c" a situation of asset duplication will occur. If an NFT is sent to and from TON multiple times Marketplaces & explorers will display more than one items with identical attributes expected to be Non-Fungible (unique) belonging to different owners which contradicts the principles of non-asset duplication.
- NFTs can be confused with SFTs (semi-fungible tokens)

# Prior art

[EVM OpenZepplin Burnable Extention Implementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/extensions/ERC721Burnable.sol)

# Unresolved questions

1. TEP-62 standard MUST be updated to support the burning functionality.
2. NFT Marketplaces and explorers must adapt the updated standard.

# Future possibilities

SFTs or semi-fungible tokens can be added to the standard to support multiple uints with identical metadata and 
