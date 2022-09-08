- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Trusted Contract Verification
- **status**: Draft
- **type**: Meta
- **authors**: [Steve Korshakov](https://github.com/ex3ndr)
- **created**: 08.09.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

This standarts aims to provide trusted infrastructure for contract verification utilizing third-party execution enviromnets that could proof the code that was executed.

NOTE: This standart is not techincally possible to use for on-chain verification, but TVM could be upgraded to support it.

# Motivation

This method allows to perform arbitrary execution offchain and have a signed result of this execution that could be verified by anyone even on blockchain.

# Guide

There are a lot of different tech that allows you to execute code in environment that could provide tools for proofing that code execution is exactly what third-party expects. This is done by exporting ability to sign arbitrary data with a certificate that's is embedded into hardware. Such enviromnents protects the most sencitive information in the world, such as Tax IDs, credit card numbers, health profiles, HSMs etc. Trusted execution environments are exist in almost all mobile phones, often as a separate chip.

There are two publicily available technologies:
* AWS Nitro Enclave
* Intel SGX (SGX Remote Attestation)

AWS Nitro Enclave is available to anyone, but Intel SGX requires communication with Intel and is not that accessible and this specification only defines workflow with AWS Nitro Enclave.

# Specification

We represent the verifiable computing environment as some pre-compiled (but reproducable) binary with a known hash. Result of computation consists of a `public key` that signs result, attestation of this `public key` that is signed by enclave hardware, and `data` signed by this `public key`

## Building an image and hash
When you build app for Nitro, the output has hashes:

* PCR0: Hash of enclave image file
* PCR1: Hash of linux kernel and bootstrap
* PCR2: Hash of application

You MUST use the PCR0 hash for verification.

## Executing result

Result is represented as json:

```json
{
    "data": "<result_of_execution>",
    "signature": "<signed_data>",
    "attestation": {
        "publicKey": "<nacl_public_key>",
        ....
    }
}
```

## Verification

First you MUST to verify `attestation` document and check `PRC0` values, extract `publicKey`, and then check `signature` of a `data`. After this you can trust that `data` was produced by a trusted code.

# Drawbacks

We are relying on third-party organization that have one of the strictest facilities in the world and protects very sencivive data, it is still not a good an idea to use for something very important. Also this implementations are very limited and this tech in general is not widespread.

# Rationale and alternatives

- ZKP. ZKP is a specific environment where you would need to re-implement your apps in another limited language. For example, it is not possible to run a compiler and provide ZKP.
- Consensus. Consensus requires stakes (to avoid nothing-at-stake) or authority to work, all staking/authority-based methods require much much less money to break than systems like AWS Nitro.

# Prior art

Other blockchains simply use centralized services that hold all sources.

# Unresolved questions

- Support for attestation in blockchain itself

# Future possibilities

Do you have ideas, which things can be implemented on top of this TEP later? Write possible ideas of new TEPs, which are related to this TEP.