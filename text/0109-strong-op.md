- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Cryptographically strong operation ids
- **status**: Draft
- **type**: Core
- **authors**: [Steve Korshakov](https://github.com/ex3ndr)
- **created**: 06.01.2023
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

Backward-compatible, SHA256-based operation identifiers for smart contracts.

# Motivation

Wallets, hardware and software one should be able to easily harden what they are signing using only offline information: the payload itself. Complex payload consists of a multiple fields of different types with a dedicated names for each field. We are proposing to also sign a cryptographically strong schema of the payload, which will be used to verify the payload itself by smart contract.

# Guide

This TEP introduces a special "wrapper" message that could wrap original message that adds a cryptographically strong operation id. This wrapper is optional and have to be handled in smart contract. If wrapper is not present, smart contract should use the original operation id.

# Specification

Wrapper is defined as a message

> **Warning**
> op calculation is not defined yet

```
strong_id#7e8A2c00 op:uint256 message:^Cell = InternalMsgBody
```

Sender would send this message with a calculated on client-side op value from the payload schema and wraps the original message. Smart contract should check if the message is wrapped and if so, it should check the op value. If the op value is not equal to the one calculated from the payload schema, the message should be rejected.

To indicate that contract supports this wrapper, it MUST return a supported interface: `org.ton.strong.v1`.

# Drawbacks

- This is a wasteful wrapper, it introduces a one more reference in the messages that would increase gas and forward fees. This method is designed mostly to be used for human-operated wallets.

# Rationale and alternatives

- Why is this design the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?

# Prior art

- Supported Interface and keeping all known interfaces in the wallets
- Transaction emulation to see what could happen

# Unresolved questions

Currently specific way to hash payload is not implemented yet

# Future possibilities

Embedding into a contracts would allow to use this wrapper when signing transactions in hardware wallets.
