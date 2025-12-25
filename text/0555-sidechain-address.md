- **TEP**: [555](https://github.com/ton-blockchain/TEPs/pull/555)
- **title**: TON Sidechain Addresses
- **status**: Draft
- **type**: Core
- **authors**: thekiba, TrueCarry
- **created**: 08.12.2024
- **replaces**: -
- **replaced by**: -

# Summary

This document extends [TEP-2](./0002-address.md) to support sidechain and L2 addresses by introducing a chain ID field in the user-friendly address format.

# Motivation

As TON ecosystem grows with sidechains and L2 solutions, users need a way to:
- Distinguish addresses across different chains
- Transfer assets between mainnet and sidechains seamlessly
- Prevent accidental cross-chain address confusion

The new format intentionally breaks compatibility with existing libraries, ensuring users cannot accidentally use sidechain addresses in mainnet-only wallets.

# Specification

## Network Chain IDs

Reserved chain IDs for existing networks:

| Network | Chain ID |
|---------|----------|
| Mainnet | -239 |
| Testnet | -3 |

These values are returned when parsing mainnet/testnet addresses, but are NOT encoded in the address bytes. Sidechains use explicit chain IDs encoded in the address.

## Sidechain Flag

A new flag `0x20` (bit 5) is added to the tag byte, following the same pattern as the testnet flag (`0x80`).

| Flag | Value | Description |
|------|-------|-------------|
| Bounceable | 0x11 | Base tag for bounceable addresses |
| Non-bounceable | 0x51 | Base tag for non-bounceable addresses |
| Testnet | +0x80 | Added for testnet addresses |
| Sidechain | +0x20 | Added for sidechain addresses |

Sidechain flag and testnet flag are **mutually exclusive**. A sidechain address MUST NOT have the testnet flag set.

Tag byte examples:
- `0x11` = bounceable, mainnet
- `0x31` = bounceable, sidechain (0x11 | 0x20)
- `0x51` = non-bounceable, mainnet
- `0x71` = non-bounceable, sidechain (0x51 | 0x20)
- `0x91` = bounceable, testnet (0x11 | 0x80)
- `0xD1` = non-bounceable, testnet (0x51 | 0x80)

## Chain ID

The chain ID is a **32-bit signed integer** identifying the specific 
sidechain or L2 network. It is encoded in big-endian format.

Note: Chain ID is distinct from workchain ID. Workchain ID identifies 
a workchain within a single chain (mainnet or sidechain), while chain 
ID identifies the chain itself.

## Sidechain address format

When the sidechain flag is set, the user-friendly address contains an additional chain_id field:

- 1 byte: tag (with sidechain flag `0x20` set)
- 1 byte: workchain_id (signed 8-bit integer)
- 4 bytes: chain_id (signed 32-bit integer, big-endian)
- 32 bytes: address hash (256 bits, big-endian)
- 2 bytes: CRC16-CCITT of the previous 38 bytes

The 40 bytes are encoded using base64url (with `_` and `-` instead of `/` and `+`), yielding 54 printable characters.

The chain_id identifies the specific sidechain or L2 network. It is distinct from workchain_id, which identifies a workchain within that chain.

### Raw Format (unchanged)

Raw format remains unchanged for all address types:

```
<workchain_id>:<64 hexadecimal digits>
```

The raw format does NOT include chain ID. Chain information is only 
available in the user-friendly format.

## Example

Consider an address with the following parameters:

| Parameter | Value |
|-----------|-------|
| chain_id | 1 |
| workchain_id | 0 |
| hash | `9da971af38d2f03abdf308d5f91636a97e5a2b07a66c39d71d7cbae3b032eddc` |

### Address Formats Comparison

| Network | Type | Length | Address |
|---------|------|--------|---------|
| Mainnet | non-bounceable | 48 | `UQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3AF4` |
| Mainnet | bounceable | 48 | `EQCdqXGvONLwOr3zCNX5FjapflorB6ZsOdcdfLrjsDLt3Fy9` |
| Sidechain (chain_id=1) | non-bounceable | 54 | `cQAAAAABnalxrzjS8Dq98wjV-RY2qX5aKwembDnXHXy647Ay7dyTvw` |
| Sidechain (chain_id=1) | bounceable | 54 | `MQAAAAABnalxrzjS8Dq98wjV-RY2qX5aKwembDnXHXy647Ay7dwSBQ` |

The sidechain addresses are 54 characters (vs 48 for mainnet) because they include the 4-byte chain_id field.

## Wallet applications

When sending:

1. The wallet app parses the tag byte to check for the sidechain flag (`0x20`).

2. If the sidechain flag is set:
   - The wallet extracts the chain_id from bytes 2-5
   - If the wallet is connected to a different chain, it may offer to bridge assets to the target chain

3. If the address has both sidechain flag and testnet flag set, the address is invalid.

# Drawbacks

- Longer addresses (54 vs 48 characters) may be less convenient for manual entry
- Requires wallet updates to support the new format, but they won't support new chains without updates anyway

# Rationale and alternatives

- Different address length ensures old libraries fail explicitly rather than silently
- Sidechain and testnet flags are mutually exclusive because sidechains manage their own test environments
