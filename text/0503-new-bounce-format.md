- **TEP**: [503](https://github.com/ton-blockchain/TEPs/pull/503)
- **title**: New Bounce Message Format
- **status**: Draft
- **type**: Core
- **authors**: [SpyCheese](https://github.com/SpyCheese)
- **created**: 25.07.2025
- **replaces**: [TEP-496](https://github.com/ton-blockchain/TEPs/pull/496)
- **replaced by**: -

# Summary

This TEP introduces a new format for bounced messages to include the whole original message body and some information about
the transaction. For compatibility, this new format is optional; it is enabled by special flags.

# Motivation

The motivation behind extending bounced messages is described in [TEP-496](https://github.com/ton-blockchain/TEPs/pull/496).
In short, currently the bounced message returns only the first 256 bits of the original, which is not enough for some applications.
Also, certain information about the transaction that bounced (such as TVM exit code) can be useful for the caller.

However, the approach proposed in [TEP-496](https://github.com/ton-blockchain/TEPs/pull/496) will require substantial changes in offchain infrastructure,
which may be too cumbersome (see Alternative Designs Considered below). This TEP suggests another option.

# Guide

Current message format for internal messages contains the field `ihr_fee:Coins`, which is always zero, as IHR is
not implemented. This field will be renamed to `extra_flags` and repurposed for flags.

`(extra_flags & 1) = 1` enables the new bounce format for the message.
The bounced message contains information about the transaction and the body of the original message.
If `(extra_flags & 3) = 3`, the whole body of the original message is included. Otherwise, only the root of the body is included (without refs).

For compatibility, if `(extra_flags & 1) = 0` then the bounced message uses the old format.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## Extra flags

The field `ihr_fee:Coins` in `CommonMsgInfo` MUST be renamed to `extra_flags` and treated differently.
Note: this field is currently unused, as IHR is not implemented, and since global version 11 `ihr_fee` is always zero.

`extra_flags` MUST still be `VarUInteger 16` (same as `Coins`). The first two bits of flags (`extra_flags & 3`) will be used to control the new bounce format.
They can be set by contract sending the message, and they MUST remain in the message unchanged.
All other bits of `extra_flags` MAY be used in the future for other purposes. While they are unused they should be set to 0: messages with non-zero higher bits will fail to be sent in Action Phase.

For compatibility, this behavior MUST be enabled by `global_version` in `ConfigParam 8`. In the older versions, the field MUST be treated as IHR fee.
In the newer versions, it MUST be treated as `extra_flags`, while IHR fee MUST be implicitly considered to be zero.

## New bounced message format

When the transaction bounces, it creates the bounce message depending on the `extra_flags` in the inbound message:
- If `(extra_flags & 1) = 0`, the bounced message MUST have the old format.
- If `(extra_flags & 3) = 1`, the bounced message MUST have the new format with the root of the body of the original message (see below).
- If `(extra_flags & 3) = 3`, the bounced message MUST have the new format with the whole body of the original message (see below).

The bounced message (either old or new) MUST have the same 0th and 1st bits of `extra_flags` as the original message.
Note: here `extra_flags` is the integer obtained after deserializing `VarUInteger 16`.

New bounced message body has the following TLB scheme:

```
_ value:CurrencyCollection created_lt:uint64 created_at:uint32 = NewBounceOriginalInfo;
_ gas_used:uint32 vm_steps:uint32 = NewBounceComputePhaseInfo;

new_bounce_body#fffffffe
    original_body:^Cell
    original_info:^NewBounceOriginalInfo
    bounced_by_phase:uint8 exit_code:int32
    compute_phase:(Maybe NewBounceComputePhaseInfo)
    = NewBounceBody;
```
- `original_body` - cell that contains the body of the original message (if `extra_flags & 2`) or only the root of the body without refs (if not `extra_flags & 2`).
- `original_info` - value, lt and unixtime of the original message.
- `bounced_by_phase` - reason why the transaction bounced:
    - `0` - compute phase was skipped. `exit_code` denotes the skip reason:
        - `exit_code = -1` - no state (the account is uninit or frozen, and no state init is present in the message).
        - `exit_code = -2` - bad state (the account is uninit or frozen, and state init in the message has the wrong hash).
        - `exit_code = -3` - no gas.
        - `exit_code = -4` - account is suspended.
    - `1` - compute phase failed. `exit_code` is the value from the compute phase.
    - `2` - action phase failed. `exit_code` is the value from the action phase.
- `exit_code` - 32-bit exit code, see above.
- `compute_phase` - exists if it was not skipped (`bounced_by_phase > 0`):
    - `gas_used`, `vm_steps` - same as in `TrComputePhase` of the transaction.

The forward fee of the bounce message SHOULD depend on its size (like ordinary messages).

In the future, other extra flags MAY change the format of the bounced message.
For compatibility, this format SHOULD NOT be changed if no other extra flags are set.

# Drawbacks

1. **Increased complexity**: Implementing logic for managing flags and building new bounced messages is required.
2. **IHR fee reuse**: Reusing `ihr_fee` field makes it more difficult to implement IHR in the future if the need arises.
3. **Fees**: The new bounced messages have larger forward fees, especially when the body of the original message is included and it is big.

# Rationale and alternatives

## Why This Design?

1. **Backward compatibility**: Behavior of existing contracts does not change.
2. **Opt-in Basis**: Only contracts that need larger bounce messages pay the additional costs.
3. **Minimal changes**: This required only changing logic for managing message flags and creating bounce messages, without new TVM opcodes or configuration parameters.
4. **Optional full body**: The body of the original message can be big, so it can be trimmed (e.g., when only exit code, opcode and query id are required).
5. **Extra flags**: Adding `extra_flags` field allows adding more message options in the future.

## Alternative Designs Considered

1. **Use metadata**: [TEP-496](https://github.com/ton-blockchain/TEPs/pull/496) suggests using message metadata for the new parameters.
While it seems simple at first, it actually entails certain difficulties. Currently, the execution of the transaction does not depend on the metadata.
Adding essential parameters to the metadata will change the interface of the transaction emulator, which will affect all its users, such as
TVM retracer, blueprint and more.
2. **Include the original message**: We could include the whole original message cell in the bounced message.
This would make parsing harder, as the body of the original message is often needed, and reaching it would require
parsing the whole `CommonMsgInfo`. Instead, we include the `original_body` and `original_info` (some parts of `CommonMsgInfo` that can be actually useful).

# Prior art

See [TEP-496 / Prior art](https://github.com/ton-blockchain/TEPs/blob/d4d094d419fcc8132d20e63338ad3986eb6b5937/text/0496-configurable-bounce-message-size.md#prior-art).

# Unresolved questions

1. What info about the transaction (other than what is suggested above) should we include?

# Future possibilities

The bounced message format may be extended in the future to include more data.
