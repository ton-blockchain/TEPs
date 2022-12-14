- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Data Signatures
- **status**: Draft
- **type**: Core
- **authors**: [Steve Korshakov](https://github.com/ex3ndr), [Oleg Andreev](https://github.com/oleganza), [Sergey Andreev](https://github.com/siandreev)
- **created**: 13.12.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

Safe signing for non-transaction data by the wallet’s key.

# Motivation

User’s wallet in TON ecosystem is not only used to perform asset transfers, but also plays a role of a universal identifier for on-chain and off-chain application.

Most commonly, the wallet is used to send TON messages that transfer coins, change ownership of tokens and interact with other smart contracts. In all these cases the client app signs a well-formed transaction that can be verified by the wallet’s public key.

The proposed protocol addresses scenarios where the wallet’s public key verifies arbitrary data used within contracts other than the user’s wallet (that is, non-transaction data) or offchain applications.

# Examples

1. Proving ownership of an address for off-chain services.
2. Signing a structured message to be verified in a TON smart contract (inside TVM).

# Safe hashing

To sign a transaction (or just a cell) for TON it is required to create **Cell Representation**, hash it and then sign. Our goal is to create a signature scheme that guarantees to never collide with the signed cells, and therefore guarantee that this scheme cannot be abused to send transaction on behalf of the wallet.

From the TON whitepaper:

>3.1.4. Standard cell representation.
>
>When a cell needs to be transferred by a network protocol or stored in a disk file, it must be serialized. 
>
>The standard representation `CellRepr(c) = CellRepr∞(c)` of a cell `c` as an octet (byte) sequence is constructed as follows:
>1. Two descriptor bytes `d1` and `d2` are serialized first. Byte `d1` equals `r+8s+32l`, where `0 ≤ r ≤ 4` is the quantity of cell references contained in the cell, `0 ≤ l ≤ 3` is the level of the cell, and `0 ≤ s ≤ 1` is 1 for exotic cells and 0 for ordinary cells. Byte `d2` equals ``⌊b/8⌋+⌈b/8⌉``, where `0 ≤ b ≤ 1023` is the quantity of data bits in `c`.
>2. Then the data bits are serialized as `⌈b/8⌉` 8-bit octets (bytes). If `b` is not a multiple of eight, a binary 1 and up to six binary 0s are appended to the data bits. After that, the data is split into `⌈b/8⌉` eight-bit groups, and each group is interpreted as 
>an unsigned big-endian integer 0 . . . 255 and stored into an octet.
>3. Finally, each of the `r` cell references is represented by 32 bytes containing the 256-bit representation hash `Hash(ci)`, explained below in 3.1.5, of the cell `ci` referred to.
>
>In this way, `2 + ⌈b/8⌉ + 32r` bytes of `CellRepr(c)` are obtained.


From the documentation follows that if we want to sign a cell with a single reference it will have a form `<prefix><reference_hash>`. Now we need to construct such `prefix` that the cell representation became invalid. It is obvious that values `5 ≤ r ≤ 7`, `2 ≤ s ≤ 3` and `4 ≤ l ≤ 7` are all invalid. We will pick the maximum values for each of these parameters making the byte `d1` equal `0xff`.

While this is enough to make the cell representation invalid, we will strengthen it further in case the cell representation is expanded in the future. Second byte `d2` does not have invalid values by itself, so let's just pick the same maximum value `0xff`. This value would indicate `1023` bits of data in the cell. We make that value invalid if we write a bit string that is less than 127 bytes long.

# Specification

Let `X` be the arbitrary payload cell.

Let `timestamp` be the UNIX timestamp in seconds (since 00:00:00 UTC on 1 January 1970) on signer’s device at the moment on creating the signature.

Let `schema_version` be the 4-byte number indicating the layout and semantics of payload `X`.

To sign an arbitrary cell that couldn't be used as a transaction in blockchain we compute data for signing in the following way:

```
ed25519(
    sha256(
        0xffff ++ 
        uint32be(schema_version) ++ 
        uint64be(timestamp) ++ 
        cell_hash(X) 
    ),
    privkey
)
```

In JS:

```js
let X: Cell;                           // Payload cell
let prefix = Buffer.alloc(2 + 4 + 8);  // d1 + d2 + version + timestamp
prefix.writeUInt8(0xff);
prefix.writeUInt8(0xff);
prefix.writeUint32BE(schema_version);
prefix.writeUint64BE(timestamp);
let sighash = sha256(Buffer.concat([prefix, X.hash()]));
let signature = Ed25519Sign(sighash, privkey);
```

In FunC:

```
cell X;                     ;; Payload cell
var b = begin_cell()
                 .store_uint(0xff, 8)
                 .store_uint(0xff, 8)
                 .store_uint(schema_version, 32)
                 .store_uint(timestamp, 64)
                 .store_uint(cell_hash(x), 256)
                 .end_cell();
var target_hash = string_hash(b);
var is_valid = check_signature(target_hash, sig, pk);
```

## Transporting signed data into smart contracts

This specification recommends the following packaging of the signed data:

```
Cell {
  bits: signature (512 bits) ++ schema_version (32 bits) ++ timestamp (64 bits)
  refs: [ X ]
}
```


## Payload verification

For users’ safety every signature should be bound to a specific *place* and *time*. Note that all the signatures are produced by the same wallet’s key and each app, service or smart contract must enforce domain separation for itself.

**Schema version** is used to specify the layout of payload cell that in turn defines domain separation. The app should verify the schema version value and reject signatures with unsupported schema version.

This specification reserves all schema versions with high bit set to 0 (i.e. in the interval `[0, 2**31)`). Applications may use non-standard schemas in the range `[2**31, 2**32)`.

**Payload cell** contains arbitrary data. 

**Timestamp** binds the signature to the moment of time. Applications must reject expired signatures per their TTL parameter.


## Standard schema versions

### Version 0: plain text message

Version 0 schema defines the _bits_ portion of the payload cell as UTF-8 text string that should be displayed to the user.

Binary parameters (not visible to the user) are placed in the cell references.

Wallets MUST display the text string to the user.

Applications MUST verify the contents of the signed string to enforce the domain separation.


```
var X_version0 = begin_cell()
                 .store_slice("utf8 text")
                 .store_ref(begin_cell().store_slice("data...").end_cell())
                 .end_cell();
```

### Version 1: binding to a contract

Version 1 binds the message to a contract address.

Wallets MUST display the contract address to the user.

TON contract MUST verify that the signed contract address matches its own.

```
var X_version1 = begin_cell()
                 .store_slice()
                 .store_ref(begin_cell().store_slice("data...").end_cell())
                 .end_cell();
```

### Version 2: binding to a TON.DNS name

Version 2 binds the message to a TON.DNS name.

Wallets MUST display the TON.DNS name and verify that the request came from the current owner of that DNS record. 
Verification of the request origin is outside the scope of this specification.

Applications MUST verify that the signed name matches the name of their application.

```
var X_version1 = begin_cell()
                 .store_slice()
                 .store_ref(begin_cell().store_slice("data...").end_cell())
                 .end_cell();
```




# Drawbacks

None


# Rationale and alternatives

## Encoding data in cells

Offchain applications do not generally need to work with TON cells, however we propose a single encoding that is also usable inside TVM to keep the specification simple.


## Binding signatures to a current timestamp

Schnorr signatures (e.g. Ed25519) are non-repudiable and replayable by design. To avoid long-range vulnerabilities, e.g. when a secret key becomes known, all signatures must be bound to the shortest time window that is reasonable in a given application. For instance, a few minutes for a real-time use by a single party, or several hours or days for collecting signatures from multiple parties.


## Schema version and payload verification

User’s security depends on cooperation between the wallets and the applications to enforce *domain separation*.

Applications enforce domain separation to reject signatures from other domains.

Wallets enforce domain separation to protect users from inadvertently signing for another app.

The role of schema version is to coordinate wallets and apps.

**Version 1** offers the most relaxed guarantees with no built-in verification on the wallet’s part. User needs to check the text they are signing and apps must embed domain separation in that text.

**Version 2** offers strong binding to a specific smart contract. Wallets may display a name and an icon for the well-known contracts and even interpret parameters as specific actions.

**Version 3** offers strong binding to a TON.DNS record. This is allows wallets perform a real-time verification that the request is signed by the named service and eliminate virtually any possibility for phishing since the service controls the entire authentication flow: even if the user does not pay attention to the text in the confirmation window.


# Prior art

This proposal is a simplified variation of [Ethereum EIP-1271](https://eips.ethereum.org/EIPS/eip-1271).

This is based on [Steve Korshakov’s](https://github.com/ex3ndr) [safe signing proposal](https://github.com/ton-blockchain/TEPs/pull/93).

# Unresolved questions

None

# Future possibilities

In the future more schema versions could be added that specify the contents of the payload data along with the protocol for verifying that data.


