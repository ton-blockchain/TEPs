- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: aNFT (Acceptable NFT)
- **status**: Active
- **type**: Contract Interface
- **authors**: [Asidert (Boris Zyrianov)](https://github.com/asidert) 
- **created**: 09.05.2024
- **replaces**: [TEP-62](https://github.com/ton-blockchain/TEPs/blob/master/0062-nft-standard.md)
- **replaced by**: -

# Summary

A standard of NFT that must be accepted by receiver to complete transfer

# Motivation

At first, the scam on the TON network was harmless, QR codes in the form of NFTs that can be sent to a zero address by paying a transfer fee.
But at the moment, the scam has become more complicated, scammers have begun to change NFT smart contracts, for example, so that the sent NFT is returned to the sender’s address, and the transfer commission (which the wallet sends with a reserve of 1+ TON) is sent to the attacker.

# Guide

Acceptable Non-Fungible Token (aNFT) represents an ownership over unique digital asset (kitten images, title deeds, artworks, etc).
Ownership transfer must be accepted by receiver.
Each separate token is an _NFT Item_. It is also convenient to gather NFT Items into an _NFT Collection_. In TON, each NFT Item and NFT Collection are separate smart contracts. 

# Specification

**This must be filled out**

This section describes your feature formally. It contains requirements, which must be followed in order to implement your TEP. To keep things formal, it is convenient to follow [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt). You should include following text at the beginning of this section:

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

# Drawbacks

**This must be filled out**

Why should we *not* do this?

# Rationale and alternatives

**This must be filled out**

- Why is this design the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?

# Prior art

**This must be filled out**

Discuss prior art, both the good and the bad, in relation to this proposal. How the problem stated in "Motivation" section was solved in another blockchains? This section encourages you as an author to learn from others' mistakes. Feel free to include links to blogs, books, Durov's whitepapers, etc.

# Unresolved questions

**This must be filled out**

If there are some questions that have to be discussed during review process or to be solved during implementation of this TEP, write it here.

# Future possibilities

**This must be filled out**

Do you have ideas, which things can be implemented on top of this TEP later? Write possible ideas of new TEPs, which are related to this TEP.
