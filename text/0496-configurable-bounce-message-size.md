- **TEP**: [496](https://github.com/ton-blockchain/TEPs/pull/496)
- **title**: Configurable Bounce Message Size
- **status**: Draft
- **type**: Core
- **authors**: [Nick Nekilov](https://github.com/NickNekilov)
- **created**: 20.06.2025
- **replaces**: -
- **replaced by**: -

# Summary

This TEP introduces a mechanism for senders to specify how much data should be included in bounce messages when transactions fail, allowing for more flexible error handling while maintaining backward compatibility with existing contracts.

# Motivation

Currently, TON's bounce mechanism only includes the first 256 bits of the original message body in bounced messages. This limitation makes it difficult for smart contracts to implement sophisticated error handling, as they cannot receive enough context about what went wrong.

The 256-bit limit is particularly problematic because it's not even sufficient to store a single TON address (which requires 267 bits for `addr_std` format - 2 bits for tag + 1 bit for anycast + 8 bits for workchain + 256 bits for address), let alone include operation codes, query IDs, or any meaningful error context that modern smart contracts need for proper error handling.

While simply increasing the default bounce size would break existing contracts (due to increased forward fees), many modern applications need more detailed error information. DeFi protocols, complex multi-step transactions, and debugging tools would benefit significantly from configurable bounce message sizes.

The current bounce implementation in `transaction.cpp` shows this limitation:
```cpp
int body_bits = std::min((int)cs.size(), cfg.bounce_msg_body); // Currently 256
```

This means that even the most basic information like "which address caused the failure" or "what operation was being attempted" cannot be reliably communicated back to the sender, severely limiting the ability to build robust, user-friendly applications on TON.

# Guide

When sending a message, a smart contract can now specify how much of the message body should be returned in case of a bounce. This is done through an extended `action_send_msg` action and a new TVM opcode that includes bounce metadata.

Example usage:
1. A DEX contract sends a swap message with 1024 bits and 2 cell references of bounce data requested
2. If the swap fails, the bounced message will contain up to 1024 bits and 2 cell references from the original message
3. The DEX can parse this data to understand exactly what went wrong and take appropriate action

For backward compatibility, existing contracts continue to work unchanged with the default 256-bit bounce size and 0 cell references.

# Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## Message Metadata Extension

The `MsgMetadata` structure SHALL be extended to include bounce configuration:

```tlb
msg_metadata_v2#1 depth:uint32 initiator_addr:MsgAddressInt initiator_lt:uint64 
                  bounce_body_bits:(## 10) bounce_body_refs:(## 3) = MsgMetadata;
```

Where:
- `bounce_body_bits` specifies the number of bits from the original message body to include in bounce messages (0-991; 991 since body includes `0xffffffff` prefix)
- `bounce_body_refs` specifies the number of cell references from the original message body to include in bounce messages (0-4)

## Extended Send Message Action

A new version of `action_send_msg` SHALL be introduced:

```tlb
action_send_msg_v2#221a09eb mode:(## 8)
  out_msg:^(MessageRelaxed Any)
  bounce_body_bits:(## 10)
  bounce_body_refs:(## 3) = OutAction;
```

## New TVM Opcode

A new TVM opcode `SENDMSGEXT` SHALL be introduced:

- **Opcode**: `0xFB09`
- **Stack**: `c b r x - fee`
- **Parameters**:
    - `c` (cell) - message to send
    - `b` (integer) - amount of bits to return in bounce message (0-991)
    - `r` (integer) - amount of cell references to return in bounce message (0-4)
    - `x` (integer) - send mode (same as existing `SENDRAWMSG`)
- **Returns**: `fee` (integer) - estimated forward fee for the message

The opcode SHALL create an `action_send_msg_v2` action with the specified bounce parameters.

## Implementation Requirements

1. **Backward Compatibility**:
    - Existing `action_send_msg#0ec3c86d` actions MUST continue to work with the default bounce size (256 bits, 0 refs)
    - Existing `SENDRAWMSG` opcode MUST remain unchanged

2. **Bounce Size Limits**: The bounce parameters MUST be limited to prevent abuse:
    - `bounce_body_bits`: 0-991 bits (configurable via global config)
    - `bounce_body_refs`: 0-4 cell references (configurable via global config)

3. **Fee Calculation**: Forward fees MUST be calculated based on the actual bounce message size, not the requested size.

4. **Metadata Propagation**: When a message with bounce metadata is processed:
    - If the transaction succeeds, metadata is ignored
    - If the transaction fails and bounce is enabled, the specified bounce size MUST be used

5. **Transport**: The bounce size information SHALL be stored in the message envelope's metadata field during message routing.

6. **Opcode Validation**: The `SENDMSGEXT` opcode MUST validate that bounce parameters are within configured limits

## Configuration Parameters

A new configuration parameter SHALL be added:

```tlb
bounce_config#01 max_bounce_body_bits:(## 10) max_bounce_body_refs:(## 3) = BounceConfig;
_ BounceConfig = ConfigParam 46;
```

## Transaction Processing Changes

The bounce phase implementation MUST be updated to:

1. Use the specified bounce size and reference count instead of the defaults
2. Calculate fees based on the actual bounce message size including referenced cells
3. Include the specified number of cell references in the bounce message body

# Drawbacks

1. **Increased Complexity**: The implementation adds complexity to message processing and validation logic.

2. **Testing Burden**: More edge cases and interaction patterns need to be tested.

3. **TVM Changes**: Adding a new opcode requires updates to TVM implementation and validation.

# Rationale and alternatives

## Why This Design?

1. **Backward Compatibility**: Existing contracts continue to work without changes.
2. **Opt-in Basis**: Only contracts that need larger bounce messages pay the additional costs.
3. **Configurable Limits**: Network operators can adjust limits based on network conditions.
4. **Metadata Approach**: Using message metadata keeps the core message format unchanged while allowing new functionality.
5. **Dual Interface**: Both low-level actions and high-level TVM opcodes provide flexibility for different use cases.

## Alternative Designs Considered

1. **Global Bounce Size Increase**: Would break existing contracts due to fee changes.
2. **Mode-based Approach**: Using mode bits in existing actions would limit extensibility.
3. **Separate Bounce Messages**: Creating entirely separate bounce message types would complicate the protocol significantly.
4. **Only Opcode Solution**: Would require all contracts to migrate to new opcodes.

## Impact of Not Implementing

Without this feature, TON will continue to lag behind other blockchain platforms in terms of error handling sophistication, potentially limiting adoption for complex DeFi and enterprise applications.

# Prior art

1. **Ethereum**: Failed transactions include full revert data, though this comes with higher costs.
2. **Solana**: Program errors can include custom error codes and data.
3. **Traditional Systems**: TCP/IP allows for variable-length error responses based on application needs.

The TON approach is unique in providing bounceable messages, but the current size limitation reduces their effectiveness compared to error handling in other systems.

# Unresolved questions

1. Should there be different limits for different workchains?
2. Should the `SENDMSGEXT` opcode support additional parameters for future extensibility?

# Future possibilities

1. **Structured Error Data**: Future TEPs could define standardized error data formats for common contract types.
2. **Debug Mode**: A special debug mode could provide even more detailed transaction failure information (e.g. include compute phase status or `exit_code`).
3. **Enhanced Opcodes**: Additional opcodes could be added for more sophisticated message handling scenarios.
