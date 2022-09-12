- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Safe Signing
- **status**: Draft
- **type**: Core
- **authors**: [Steve Korshakov](https://github.com/ex3ndr)
- **created**: 12.09.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

Safe signing for non-transaction data.

# Motivation

To prove ownership of an address for off-chain services, it is required to provide signing of arbitrary data from wallets. Unfortunately, since key is the same we have to construct a safe way to sign to avoid malicilous signing of a transaction. This specifications does exactly that.

# Guide

To sign a transaction (or just a cell) for TON it is required to create **Cell Representation**, hash it and then sign. Our goal is to create prefix that would never lead for correct
representation.

From whitepaper:

```
3.1.4. Standard cell representation. 
When a cell needs to be transferred by a network protocol or stored in a disk file, it must be serialized. 
The standard representation CellRepr(c) = CellRepr∞(c) of a cell c as an octet (byte) sequence is constructed as follows:
1. Two descriptor bytes d1 and d2 are serialized first. Byte d1 equals r+8s+32l, where 0 ≤ r ≤ 4 is the quantity of cell references
contained in the cell, 0 ≤ l ≤ 3 is the level of the cell, and 0 ≤ s ≤ 1 is 1 for exotic cells and 0 for ordinary cells. Byte d2 equals 
⌊b/8⌋+⌈b/8⌉, where 0 ≤ b ≤ 1023 is the quantity of data bits in c.
2. Then the data bits are serialized as ⌈b/8⌉ 8-bit octets (bytes). If b is not a multiple of eight, a binary 1 and up to six 
binary 0s are appended to the data bits. After that, the data is split into ⌈b/8⌉ eight-bit groups, and each group is interpreted as 
an unsigned big-endian integer 0 . . . 255 and stored into an octet.
3. Finally, each of the r cell references is represented by 32 bytes contain- ing the 256-bit representation hash Hash(ci), explained
below in 3.1.5, of the cell ci referred to.
In this way, 2 + ⌈b/8⌉ + 32r bytes of CellRepr(c) are obtained.
```

From documentation it is obvious that if we want to sign cell with a single reference it will have a form if `<prefix><referehce_hash>`. Now we need to construct prefix the way representation became invalid. It is obvious that values `5 ≤ r ≤ 7`, `2 ≤ s ≤ 3` and `4 ≤ l ≤ 7` are all invalid. We will pick maximum values and this would be `0xff` byte. While this already makes representation invalid we will strength it even further just in case if cell representation specification will be expanded. Second byte doesn't have invalid values so let's just pick the same `0xff` byte. This value would represent `1023` bits, to make it invalid we will simply write to buffer anything that is less than 127 bytes long. This standart defines this as binary representation of string `ton-safe-sign-magic`.

# Specification

To sign an arbitrary cell that couldn't later used as a transaction in blockchain we compute data for signing next way:

```js
let cell: Cell; // Incoming cell
let hash = cell.hash(); // Hash of cell
let data = sha256(Buffer.concat([Buffer.from([0xff, 0xff]), Buffer.from('ton-safe-sign-magic'), hash])); // Data to hash
let signature = sign(data, publicKey); // Resulting signature
```

For specific needs it is possible to change `ton-safe-sign-magic` for separating different signature usage, for example for signing "child" keys that could be used as proof of ownership off-chain or on-chain, but this string must be non-zero and not too big to form a 127 bytes string for signing.

# Drawbacks

None

# Rationale and alternatives

None

# Prior art

This poposal is a variation of [Ethereum one](https://eips.ethereum.org/EIPS/eip-1271).

# Unresolved questions

None

# Future possibilities

None
