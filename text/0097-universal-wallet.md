- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Universal Wallet
- **status**: Draft
- **type**: Core
- **authors**: [Steve Korshakov](https://github.com/ex3ndr) *(replace)*
- **created**: 06.10.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

This TEP introduces universal wallet contract that can be upgraded by validator voting.

# Motivation

Currently TON have multiple generations of wallet contracts and it was very painful to upgrade users from old to a newer one. Currently even after 4 generations and dozen of revisions it is still incomplete and from time to time requires upgrades. Upgrading currently involves change of address and requires to move all your assets to a new address and could cause a lot of mess and non-managebale for average user.

# Guide

This universal wallet is implemented as FIFT code that fetches code from config param #74 and executes it.

# Specification

Code for a universal wallet is placed as critical config #74 and could be upgraded by voting by validators.

The wallet itself have code (Fift):
```
PUSHINT 74
CONFIGPARAM
BLESS
JMPX
```

And inital data is `seq:int64 public_key:int256 wallet_id:int64`.

# Drawbacks

This wallet shouldn't be used in critical infrastructure like validator voting just in case if there would be mistake that make all universal wallets inoperable.

# Rationale and alternatives

Most of the networks could upgrade how end-user wallets works by updating the network itself and introducing new features in the core of the network. This is intrusive and requires upgrade of everyone in the network to make it happen. TON allows upgrade wallet contracts without needing to upgrade node code.

As alterinative implementation could allow optional upgrade of a wallet contract to the latest one, this is more secure, but we expect that most users won't even know that upgrade was performant anyway and would be done automatically by wallets.

# Prior art

Manual upgrades produces havoc in the community, explaining that upgrade changes address is very painful and already introduced weird specifications that rely on public key instead of an address.

# Unresolved questions

How and who would review this contract code?

# Future possibilities

All upgrades must upgraded via TEP and then validator voting.
