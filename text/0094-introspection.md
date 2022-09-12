- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Contract Introspection
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Steve Korshakov](https://github.com/ex3ndr), 
- **created**: 12.09.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

This proposal recommends a way to introspect smart contracts.

# Motivation

Right now it is impossible to guess what user want to do with a contract or can't figure out what transaction is about because there are no clear way to find what contract is about. Human need to remember of guess what this was about in most ways.

# Guide

When human tries to sign a transaction, they need to understand clearly what they are doing: minting, token transfer, staking, DAO voting. While Ethereum wallets support signing arbitrary structures it is still not clear what are you signing and what's the implications of doing so. The same way explorers can't show what's going on in a nice form.

The start of a working with specific contract is a performing introspection - figuring out what contract declares about itself. When app knows what this contract about it could build a good UI, show transaction history and verify what human tries to sign.

This proposal describes a way to report what interfaces contract supports. 

Interfaces are defined in a free form specification. Unlike most of the other approaches this proposal definses interface as not only technical interface of a contract (get methods, internal messages, etc), but also a description about it's behaviour. Attaching hash of representation of a technical interface of a contract could cause conflicts between different standarts and because of this proposal defines interfaces loosely. Also it alows interface to be more fluid, for example token that couldn't be transfered could be just a contract that will have get method `can_transfer` that returns `false` and this would mean that this token doesn't support transfers at all without the need to implement this method.

Interface ids are a hashes of reverse domain names (like packages in Java), this avoids clashes of names between different teams if they want to build something just for themself.

# Specification

In order to support introspection contract MUST implement supports_interface GET method:

```(int...) supported_interfaces()```

Which returns list of supported interface codes. The first value MUST be `hash("org.ton.introspection.v0")` = `123515602279859691144772641439386770278`.

If first value is incorrect app MUST stop attempting to introspect contract.

Example
```func
_ supported_interfaces() method_id {
    return (123515602279859691144772641439386770278);
}
```

Hash of an interface is defined as truncated to 128 bits SHA256.

# Drawbacks

This proposal doesn't guarantee that contract would behave correctly to an interface, also it doesn't provide a guaranteed way to avoid name clashes between different interfaces. This is a non-goal for this proposal.

This proposal doesn't tied to a specific techincal interface. This could lead to a multiple same interfaces that do same thing, but with a different IDs. This is a non-goal for this proposal since centralized registry would be very useful for existing interfaces and custom one would be used mostly in-house.

# Rationale and alternatives

- Why 128 bit? We are looking at global namespace that we need to keep without conflicts, we can't use anything much smaller since the probability of conflicts would be much higher. We are looking at UUID-like entropy that is exactly 128 bit and is time-proven. More than 128 is too wasteful.
- Why freeform? As mentioned before, it is easier just to define some ID to start work early and then eventually build a standart. Also interfaces (like ERC20) usually not just a technical interface, but also a number of rules how to work with it.
- Why not finding out what contract support by decompiling? Explicit is always better than implicit in open-world scenario. We can't rely on our "disassembling" capabilities to perform introspections, even small error could be fatal.
- Why not hash of representation? Right now there are no compilers that support that, also this proposal is future proof. If anyone would want to build something more automated they could easily build their own hashes by their own rules keeping everything the same for external observer.

# Prior art

[Ethereum Interface Detection](https://eips.ethereum.org/EIPS/eip-165)

# Unresolved questions

None

# Future possibilities

This TEP could be upgraded to a more formal one when ecosystem would be ready.
