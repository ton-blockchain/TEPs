- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Referral code in Query ID
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Denis Subbotin](https://github.com/mr-tron), [Oleg Andreev](https://github.com/oleganza)
- **created**: 26.12.2023

# Summary

This is a proposal to split Query ID in two halves: the referral code and arbitrary app-specific data.

# Motivation

Standard way to self-identify apps that initiate transactions makes it easier to operate referral and profit-sharing programs and gather usage statistics.

# Guide

* Applications and services may self-assign unique identifiers to disambiguate their application from others.
* In privacy-preserving applications users may expect absence of any referral codes. In such cases apps may offer an option to leave the referral code as all-zeroes or use other app’s well-known identifier at random.

# Specification

Split 64-bit Query ID in two halves:

* First 32 bits (high bits) identify the author of the transaction: dapp or wallet that originates the message to the TON network.
* Second 32 bits (low bits) are reserved for arbitrary use: identifying individual queries in smart-contracts, random nonces etc.

# Drawbacks

This proposal splits the space of possible identifiers in two equal halves. If one's application needs a longer than 32-bit identifiers for the queries, part of the referral code space must be used. 

# Rationale and alternatives

The suggested proposal is simple and easy to follow, making on-chain statistics and referral programs easy to operate.

