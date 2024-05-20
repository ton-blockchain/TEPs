- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: On-Chain Libraries
- **status**: Draft
- **type**: Core
- **authors**: [Kayhan Alizadeh](https://github.com/kehiy)
- **created**: 07.05.2024
- **replaces**: -
- **replaced by**: -

# Summary

This document introduces a new type of on-chain source codes with no state that their functions can be invoked by 
their address and a function identifier from other contracts/actors.

# Motivation
 
This proposal introduces a way to deploy libraries (e.g. TON stdlib written in FunC) one and use them many times on the
network. this will reduce the size of network, make smart contracts more light weight and managing and using libraries
for contracts easier.

# Guide

When we write a smart contract we are able to import other source code in our code and use their functions and methods.
Once we compiled our contract code to TVM instructions the library methods and codes will be linked and included on our
code too. Now, if 1 million contracts use same library and deploy their contract on TON, then we have a huge amount of 
duplicated code on-chain. With logic of on-chain libraries, we can deploy a source code 
(e.g. TON stdlib written in FunC) and all contracts using this library will read it on-chain.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and 
> “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## Definition

We MUST define a new core concept same as smart contracts that has address and code but there is no state or storage.

## Address

This contracts/libraries address MUST be driven from their source code, so 100% same libraries won't be duplicated.

Once we had address of a deployed on-chain library we can use its address in our include/import statement. we MAY to use
a TON DNS as library address.

Example:

```func
#include "imports/stdlib.fc"; ;; current approach.

#include "UQONCHAINLIBRARYADDRESS"; ;; on-chain library.

#include "stdlib.ton"; ;; using DNS.
```

## Execution

When this code got compiled, we MUST to notice in our TVM instructions that this function, or method is need to be
loaded from an on-chain library.

The Validator SHOULD simply load on-chain libraries that a contract is using while running the contract (using the 
library address) and call library functions once it's needed. We have to consider that this calls MUST NOT be done using
any internal or external message, and they MUST be synchronous direct calls when the contract is running.

## Fee

When someone deploys a library, this library is MUST NOT to pay execution fee and execution fee will be paid same
as when we had the library code included on our contract (also there is no additional fee for loading the contract).

As there is no state and data related to any on-chain library its allocated storage is fixes always. The storage fee 
MUST be paid by caller with same fee as they are including the library code in their code (The size that called part is
allocated not a whole contract).
So, there is no more or less fee when someone using an on-chain library. Also, on-chain libraries MUST NOT be able to be
the initialized at any chance.

# Drawbacks

1. This change require to add more complexity to the protocol.

# Rationale and alternatives

- Why is this design the best in the space of possible designs?

This design will reduce the blockchain size for future and make it more scalable.

- What other designs have been considered and what is the rationale for not choosing them?

There are no same protocol with these details and approchs at the moment.

- What is the impact of not doing this?

We will get a huge amount of duplicated data on our chain when it grows to millions and billions of apps.

# Prior art

Other blockchains have concept to call other contract but in the case of libraries they are including the whole code
in the bytecodes and compiled contract.

# Unresolved questions

1. Are required changes possible on TON protocol at the moment?
2. Are the fees fair and safe?

# Future possibilities

1. The most used TON library (stdlib.fc) can be deployed on-chain which is used in most of 
the contracts (including wallets).

2. Well-known protocol and interfaces can have a library of function and methods that are duplicated on them and
contracts can use them on-chain.
