- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Data Signatures
- **status**: Draft
- **type**: Core
- **authors**: [Oleg Andreev](https://github.com/oleganza), [Sergey Andreev](https://github.com/siandreev), [Denis Subbotin](https://github.com/mr-tron)
- **created**: 13.12.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

Safe signing for non-transaction data by the wallet’s key.

# Motivation

User’s wallet in TON ecosystem is not only used to perform asset transfers, but also plays a role of a universal identifier for on-chain and off-chain application.

Most commonly, the wallet is used to send TON messages that transfer coins, change ownership of tokens and interact with other smart contracts. In all these cases the client app signs a well-formed transaction that can be verified by the wallet’s public key.

The proposed protocol addresses scenarios where the wallet’s public key verifies arbitrary data used within offchain applications and also on-chain contracts other than the user’s wallet (that is, non-transaction data).

# Examples

1. Proving ownership of an address for off-chain services.
2. Signing a structured message to be verified in a TON smart contract (inside TVM).

# Safe hashing

To sign a transaction (or just a cell) for TON it is required to create **Cell Representation**, hash it and then sign. Our goal is to create a signature scheme that guarantees to never collide with the signed cells so that signed data messages cannot be used as transactions made on behalf of the wallet.

We observe the following implementation in wallet smart contracts (FunC) where signature is computed over 256-bit message equal to the SHA256 hash of an arbitrary cell:

```
check_signature(slice_hash(in_msg), signature, public_key)
```

In this proposal we are going to compute signature over 352-bit message that consists of the schema identifier, timestamp and a hash of the payload cell X.

This signature is domain-separated from wallet transactions by having a different length of the message. 
Domain separation for the data messages is provided using the schema identifier and various layouts of the payload X.


# Specification

Let `X` be the arbitrary payload cell. The layout of the payload cell is specified using TL-B.

Let `timestamp` be the UNIX timestamp in seconds (since 00:00:00 UTC on 1 January 1970) on signer’s device at the moment on creating the signature.

Let `schema_crc` be the 4-byte CRC32 of the TL-B scheme that specifies the layout and semantics of payload `X`.

To sign an arbitrary cell that couldn't be used as a transaction in blockchain we compute data for signing in the following way:

```
ed25519(uint32be(schema_crc) ++ uint64be(timestamp) ++ cell_hash(X), privkey)
```

In JS:

```js
let X: Cell;                       // Payload cell
let prefix = Buffer.alloc(4 + 8);  // version + timestamp
prefix.writeUint32BE(schema_crc);
prefix.writeUint64BE(timestamp);
let signature = Ed25519Sign(Buffer.concat([prefix, X.hash()]), privkey);
```

In FunC:

```
cell X;  ;; Payload cell
var m = begin_cell()
                 .store_uint(schema_crc, 32)
                 .store_uint(timestamp, 64)
                 .store_uint(cell_hash(x), 256)
                 .end_cell();
var is_valid = check_data_signature(begin_parse(m), sig, pk)
```

## Transporting signed data into smart contracts

This specification recommends the following packaging of the signed data:

```
Cell {
  bits: signature (512 bits) ++ schema_crc (32 bits) ++ timestamp (64 bits)
  refs: [ X ]
}
```


## Payload verification

For users’ safety every signature should be bound to a specific *place* and *time*. Note that all the signatures are produced by the same wallet’s key and each app, service or smart contract must enforce domain separation for itself.

**Schema CRC** indicates the layout of payload cell that in turn defines domain separation. The app should verify the schema version value and reject signatures with unsupported schemas.

**Payload cell** contains arbitrary data per its TL-B definition to be verified and interpreted by the app.

**Timestamp** binds the signature to the time of signing per user’s local clock. Applications must reject expired signatures per their internal TTL parameter.


## Standard schema versions

### Short plain text message

This schema is used to sign UTF-8 text messages using _snake format_ (per [TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)).

TL-B:

```
plaintext text:Text = PayloadCell;

// From TEP-64:
tail#_ {bn:#} b:(bits bn) = SnakeData ~0;
cons#_ {bn:#} {n:#} b:(bits bn) next:^(SnakeData ~n) = SnakeData ~(n + 1);
text#_ {n:#} data:(SnakeData ~n) = Text;
```

Schema:

```
crc32('plaintext text:Text = PayloadCell') = 0x754bf91b
```

Wallets MUST display the text string to the user.

Applications MUST verify the contents of the signed string to enforce the domain separation.


### Application binding

This schema allows signing binary data for a target application identified by the TON.DNS name, contract address or both.

TL-B:

```
app_data address:(Maybe MsgAddress) domain:(Maybe ^Text) data:^Cell = PayloadCell;

// From TEP-64:
tail#_ {bn:#} b:(bits bn) = SnakeData ~0;
cons#_ {bn:#} {n:#} b:(bits bn) next:^(SnakeData ~n) = SnakeData ~(n + 1);
text#_ {n:#} data:(SnakeData ~n) = Text;
```

where:
* `data` contains application-specific data;
* `address` is an optional contract address that receives the signed message;
* `domain` is a fully-qualified TON.DNS domain in a reversed zero-delimited format (e.g. `ton\0example\0myapp\0` for `myapp.example.ton`);

Schema:

```
crc32('app_data address:(Maybe MsgAddress) domain:(Maybe ^Text) data:^Cell = PayloadCell')
    = 0xd6712a27
```

Wallets MUST reject requests where neither domain, nor address are specified.

Wallets MUST display the contract address to the user if it is included in the signature.

Wallets MUST display the TON.DNS name (if it is included under signature) and verify that the request came from the current owner of that DNS record.
Verification of the request origin is outside the scope of this specification.

TON contracts MUST verify that the message includes the address and it matches the target contract’s address.

Applications MUST verify that the signed name matches their name. Contracts MAY also perform the same check where applicable.

Application MAY display a human-readable meaning of the `data` field, if they are aware of its layout for a given smart contract `address` or the service indicated by the `domain`.


# Drawbacks

None


# Rationale and alternatives

## Encoding data in cells

Offchain applications do not generally need to work with TON cells, however we propose a single encoding that is also usable inside TVM to keep the specification simple.

## Binding signatures to a current timestamp

Schnorr signatures such as Ed25519 are non-repudiable and replayable by design. To avoid long-range vulnerabilities (e.g. when a secret key becomes known) all signatures must be bound to the shortest time window that is reasonable in a given application. For instance, a few minutes for a real-time use by a single party, or several hours or days for collecting signatures from multiple parties.

## Why timestamp is not a part of the payload?

Timestamp binding is needed in almost every protocol, so it makes sense to save space for application-specific data in the payload cell.

## Why domain name is in another cell?

Domain name is declared as `^Text` to allow pruning and storing cell hash in its place.

## Notes on domain separation

User’s security depends on cooperation between the wallets and the applications to enforce *domain separation*.

Applications enforce domain separation to reject signatures from other domains.

Wallets enforce domain separation to protect users from inadvertently signing for another app.

## How to use contract address binding

Wallets may display a name and an icon for the well-known contracts and even interpret parameters as specific actions.

## How to use TON.DNS binding

Binding the singature to the TON.DNS name allows wallets perform a real-time verification that the request is signed by the named service. This eliminates virtually any possibility for phishing since the service controls the entire authentication flow. Even if the user does not pay attention to the text in the confirmation window, it would not be possible to trick user confirm action on that service without hijacking their session.


# Prior art

This proposal is a simplified variation of [Ethereum EIP-1271](https://eips.ethereum.org/EIPS/eip-1271).

This is originally inspired by [Steve Korshakov’s](https://github.com/ex3ndr) [safe signing proposal](https://github.com/ton-blockchain/TEPs/pull/93), 
but we observe that there is a possibility of avoiding unnecessary layer of hashing and constructing invalid cell representation
since TVM support signature checks over arbitrary-sized messages.

# Unresolved questions

None

# Future possibilities

A future extension to the protocol may specify the layout and semantics of the payload data (e.g. attaching a TL-B scheme).
This would enable wallets display human-readable structure of the message to be signed.
