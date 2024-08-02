- **TEP**: [0181](https://github.com/ton-blockchain/TEPs/pull/0181)
- **title**: *TON Signing Typed Data Standard*
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Dr. Awesome Doge](https://github.com/hacker-volodya), [Pei](p@tonx.tg), [CC Wang](https://github.com/ccwang-at-TONX), [Wei Yi](https://github.com/WeiYiChiuAtTonfura)
- **created**: 30.07.2024

# Summary
This TEP proposes the introduction of a standard of signing typed data for the TON blockchain, inspired by Ethereum's EIP-191 and EIP-712. The proposed standard aims to standardize the methods for signing and verifying typed structured data on the TON blockchain. This will enhance security and interoperability for TON-based applications, particularly in scenarios involving off-chain data integrity and authentication.

# Motivation
In the TON blockchain ecosystem, there is a need for a standardized approach to sign and verify typed structured data. This standardization will:
- Enhance the security of off-chain and on-chain data interactions.
- Improve interoperability between different TON-based applications.
- Provide a clear and consistent method for developers to implement data signing and verification processes.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “NOT RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.html) and [RFC 8174](https://www.ietf.org/rfc/rfc8174.html).

## 1. Signing Typed Data Standard

This section outlines the TON version of the signing typed data standard. 

### 1.1 Format

The signable `message` is denoted as the structured data `𝕊`. Encoding along the `domainSeparator`, the format for the data to be signed MUST follow the structure:

`encode(domainSeparator : 𝔹²⁵⁶, message : 𝕊) = prefix || domainSeparator || hashStruct(message)`

`||` means bitwise concatenation and the definition of `prefix`, `domainSeparator`, and `hashStruct(message)` are described below.

### 1.2 Definition of `prefix`

The first part of the encoded signed data is 2-byte `prefix`.

`prefix = 0xFF || flag`

The 1-byte `flag` is in the range `[0x00, 0xFF]`. Besides, `0xFF` represents for choosing SHA256 hash function along with the following encoding procedure. The rest of `[0x00, 0xFE]` is reserved for the future use. Note that the category of hash function using in the whole signing procedure MUST be kept consistent.

### 1.3 Definition of structured data 𝕊

Before getting started to define the core functionality of encoding, we need to clarify which data type of `message` can be encoded. To reach the maximum composability of TON Virtual Machine (TVM), the acceptable encoding types MUST be specific to the TVM. However, it aims to be agnostic to higher level languages such as FunC and can be added new types in the future.

- The `atomic` types are directly supported by TVM and other higher-level languages, such as `int`, `cell`, and `slice`.
    - Floating point numbers are not supported at this point but may be supported by the future TEPs.
    - To make a less ambiguous representation, the name of integer and unsigned integer types needs to specify the length of bits. For example, `int8` and `uint32` are acceptable, but using the `int` type name is not allowed.
- The `composite` type is composed of several `atomic` types whose type definition MUST be written in a fixed order representing the encoding and decoding sequence. For example, `foo {int2 a; uint4 b; cell c;}` means the `composite` type `foo` consists of three `atomic` types  respectively two integers `a`, `b` and a cell `c`.


### 1.4 Definition of `encodeType()`

When the message `s` is made up of a single `atomic` type, taking the `typeOf` operation of it is simple: `typeOf(s) = type ‖ " " ‖ name`, e.g., `typeOf(int8 a) = int8 a`.

When the message `s` is `composite` type, we MUST apply the `encodeType()` definition recursively: `name ‖ "(" ‖ member₁ ‖ "," ‖ member₂ ‖ "," ‖ … ‖ memberₙ ")"` where every `member` is either a `composite` type or an `atomic` type. If `member` is an `atomic` type, we apply the `typeOf` operation described above. Otherwise, we recursively apply the `encodeType` operation to this composite `member`. Every step of recursively applying `encodeType` needs to be done after full describing the parent type. More precisely, we use the C3 linearization algorithm here.

For instance, the example above mentioned is `encodeType(foo) = foo(int2 a, uint4 b, cell c)`.

### 1.5 Definition of `encodeData()`

The encoding of a struct instance is `enc(value₁) ‖ enc(value₂) ‖ … ‖ enc(valueₙ)`, i.e. the concatenation of the encoded member values in the order that they appear in the type. Every encoded member value must less than 1023 bits. Developers SHOULD use the formal cell representation to deal with the data which is longer than 1023 bits.

### 1.6 Definition of `hashStruct()`

The `typeHash` operation is defined as `hash(encodeType(s))` which SHOULD be a constant value for a given structured data and does not need to be runtime computed.

Finally, we define `hashStruct(s : 𝕊) = hash(typeHash(s) ‖ encodeData(s))`.

### 1.7 Definition of `domainSeparator`

```
domainSeparator = hashStruct(tep181Domain)
```
where the type of `tep181Domain` is a `composite` type named `TEP181Domain` with one or more of the below fields. Protocol designers only need to include the fields that make sense for their signing domain. Unused fields are left out of the `composite` type.

```
TEP181Domain {
  uint32 name;
  uint32 version;
  int32 workchainId;
  uint256 verifierContract;
  cell salt;
}
```

- `name` is the user readable signing domain's string of name, i.e. the name of the DApp or the protocol. To minimize the bit length usage, we SHALL take the first 32 bits of the SHA256 hash value to the whole string.
- `version` is the current major version of the signing domain. Signatures from different versions are not compatible. To minimize the bit length usage, we SHALL take the first 32 bits of the SHA256 hash value to the whole string.
- `workchainId` is the workchain ID which SHALL be used for user agent to refuse signing if it does not match the currently active workchain.
- `verifierContract` is the TON address of the smart contract that will verify the signature. The user agents do contract specific phishing prevention.
- `salt` is the disambiguating salt for the protocol usd to prevent hash collision. This field is optional for developers, so it MAY be omitted.

Future extensions to this TEP MAY add new fields with new user agent behavior constraints. User agents are free to use the provided information to inform/warn users or refuse signing. DApp implementers SHOULD NOT add private fields, new fields MUST be proposed through the TEP process.

The `TEP181Domain` fields SHOULD be in the order as above, skipping any absent fields. Future field additions must be in alphabetical order and come after the above fields. User agents MAY accept fields in any order as specified by the `TEP181Domain` type.

## 2. Signing and Verification

### 2.1 Signing Process
To sign a message:

```
Ed25519Sign(privateKey, SHA256(encode(domainSeparator, message))) = signature
```


### 2.2 Verification Process
To verify a signed message:

```
assert(Ed25519Verify(publicKey, signature), true)
```


```mermaid
sequenceDiagram
    participant User
    participant DApp
    participant TON Node
    participant Verifier Contract
    participant Target Contract
    User->>DApp: Send Message
    DApp->>TON Node: Hash + Signature
    TON Node-->>Verifier Contract: Hash + Signature
    Verifier Contract->>Target Contract: External Message: Okay
```

# Example Implementations

## Example in TypeScript

https://gist.github.com/a2468834/17dc14ed6e64a30b3df5e44c5da04314

## Example in FunC

https://gist.github.com/a2468834/5fa6b5698c0b478296fbedfdc12edb0a


# Rationale
The rationale behind this proposal is to provide a robust and standardized way to handle data signing and verification within the TON ecosystem. By adopting and adapting the proven methods from Ethereum (EIP-191 and EIP-712), we can ensure a high level of security and interoperability.

# Implementation
The implementation will involve:
- Developing libraries and tools to support the new standards.
- Updating relevant documentation and guides for developers.
- Conducting security audits and tests to ensure the robustness of the implementation.

# Backward Compatibility
This proposal introduces new methods and standards that do not interfere with existing TON blockchain functionalities. It is fully backward compatible.

# Security Considerations
Discuss potential security risks and mitigation strategies, including:
- Ensuring the integrity of the signed data.
- Protecting against replay attacks.
- Verifying the authenticity of the signer's public key.

---

By adopting this TEP, the TON blockchain will benefit from enhanced data integrity, security, and interoperability, paving the way for more sophisticated and secure decentralized applications.