- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: TLB Plus
- **status**: Draft
- **type**: Core
- **authors**: [Steve Korshakov](https://github.com/ex3ndr)
- **created**: 04.01.2023
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

This TEP introduces TLB+ language that is simplified and more polished version of TLB that is useful to use in smart contracts instead of a full-blown TLB. It is also provides a way to secure TLB+ with a full hash of a schema and being able to sign messages in hardware wallets without the need of Ledger to have any information from the blockchain.

# Motivation

Time goes and no one built a working TLB parser for all languages, we are propossing to simplify TLB and make it more useful for smart contracts and developers that build tools for TON.

# Guide

Explain this document in simple language, as if you were teaching it to another developers. Give examples how your feature will work in real life.

# Specification

TLB+ just like TLB specifies the way to serialize messages to make them received by the smart contract.

# TLB+ syntax

Differences from TLB:

* Every field have predictable size and serialization
* No explicit references
* Automatic allocation of fields into cells in a deterministic way
* Extended types support without low level details how they work
* contstructor id calculated using hash of the shema that must include hashes of all included types
* have long (256 bit) constructor id that is cryptographically strong, but optional
* Number of constructors are always limited to one per type

Example:
```
human_info#_ age:int8 = HumanInfo;
hello_world#68ff65f3 name:string info:HumanInfo? extras:dict<int8, string>, photo: bytes(128) = HelloWorld;
```

## Types
TLB+ includes this types:

* Numbers: `int8`, `uint8`, `int32`, `uint32`, `int64`, `uint64`, `int256`, `uint256`, `int257` and `coins`
* Byte arrays: `bytes8`, `bytes16`, `bytes32` and `bytes64`
* Text string: `string`
* Address: `address` that represents simple standart master/workchain address and no other varians including `null` address
* Dictionary: `dict<K, V>` where `K` could be number primitive or an `address`, value could be any type.
* Low level primitives: `slice` and `cell`. `slice` means "read everything till the end" and could be used only as a last variable
* Optionals: Any type except dictionary could be marked as optional using `?` in the end


## Serialization

Serialization mostly follows TLB serialization, but include automatic allication. Allocation is performed using greedy algorithm and is deterministic. It means that if you have two messages with the same schema, they will be serialized in the same way.

### Numbers and bytes
Numbers and butes are serialized the same way as specified in `TVM` specification.

### String
There are a way to serialize string in TLB+ that is similar to the way comments work in TON blockchain.
String always goes to a reference and from there it fills the cell until reaching the end, then continues to the next cell. It is allowed to split single unicode symbol between cells, so developers could simply work with strings as with byte arrays.

### Address
Address serialization is a bit different from TLB. The only acceptable value is 267 bit serialization that represents standard address without unicast or any other variants. If address marked as optional then two-bit zero serialization for `null` value is allowed. This backward compatible with how eveyrthing works in TLB.

### Dictionary
Unlike TLB dictionaries, in TLB+ they are always could be empty, there are no difference between the one that never could be empty and the one that could. Other than that, they are serialized the same way as in TLB, using serialization of keys that are defined above.

### Cell
Cell is serialized as is a simple reference.

### Slice
Slice is a special type that means "read everything till the end". It is allowed to use only as a last variable in the message. It is useful for anyone who want to add some extensibility to the schema.

### Optionals
For all types except `address` optionals are serialized the same way as `Maybe` in TLB. For `address` it is serialized the same way as in TLB.

# Drawbacks

- This TEP is not that flexible as TLB
- This TEP could be even simpler, but it would be too far from TLB

# Rationale and alternatives

- Support full TLB by everyone, but it is challenging to implement something like dictionaries in a type safe format that would work at scale.
- In full TLB it is possible to mis-align variables and eventually get into overflow and therefore corrupt the contract.

# Prior art

Prior art is a simplicity of TL language, that developers find easy to use and understand. TLB is overengineered and too complex for most of the developers.