- **TEP**: [467](https://github.com/ton-blockchain/TEPs/pull/467)
- **title**: Normalized Message Hash
- **status**: Draft
- **type**: Core
- **authors**: [Denis Subbotin](https://github.com/mr-tron)
- **created**: 03.04.2025
- **replaces**: -
- **replaced by**: -

# Summary

This proposal introduces the concept of a "normalized message hash" for external-in messages in the TON Blockchain. The normalized hash remains consistent despite variations in certain message fields that do not affect the message's validity. This enhancement aims to improve the reliability of transaction tracking and deduplication processes.

# Motivation

In the current TON Blockchain implementation, tracking transactions using message hashes can be unreliable due to the inclusion of non-essential fields in the hash computation. Fields such as `src`, `import_fee`, and `init` can vary without impacting the message's validity, leading to different hashes for effectively identical messages. This variability complicates transaction tracking and deduplication, as highlighted in the [TON Console documentation](https://docs.tonconsole.com/academy/transaction-tracking).

By introducing a normalized message hash that excludes these non-essential fields, we can ensure a consistent and reliable identifier for external-in messages, thereby enhancing the efficiency of transaction tracking and deduplication mechanisms.

# Guide

The normalized message hash is computed by serializing the external-in message with the following standardizations:

1. **Source Address (`src`)**: Set to `addr_none$00`.
2. **Import Fee (`import_fee`)**: Set to `0`.
3. **InitState (`init:(Maybe (Either StateInit ^StateInit))`)**: Set to `nothing$0`.
4. **Body (`body:(Either X ^X)`)**: Is always stored as `^X`.

The body of the message is included as-is without modification. This approach ensures that the hash remains consistent for messages that are functionally identical, since it eliminates all variable fields (check discussion on `addr_var` and `anycast` below).

Normalized hash may serve as reliable and permanent identificator of the message immediately after sending to network, even if relying nodes will repack the message.

# Specification

1. **Normalization Process**:
   - **Source Address (`src`)**: MUST be set to `addr_none$00`.
   - **Import Fee (`import_fee`)**: MUST be set to `0`.
   - **InitState (`init`)**: MUST be set to empty.
   - **Body**: MUST be included as Reference.

2. **Hash Computation**:
   - The normalized hash is standard hash of the cell with message packed according to rules above.

# Uniqueness
The normalized message hash defined in this proposal is not a globally unique identifier across the entire blockchain. In the context of custom smart contracts, it is possible for identical (or slightly modified) external messages—resulting in the same normalized hash—to initiate multiple, distinct transaction chains.

However, under certain relatively common conditions, the normalized message hash can serve as a unique identifier for a specific chain of transactions, or trace. In particular, this uniqueness holds if:
- The message is sent to a wallet contract;
- The message includes an instruction to send an internal message with the IGNORE_ERRORS=+2 flag (required both by the TON Connect protocol and by wallets starting from version w5);
- The wallet contract is never deleted.

Under these conditions, all externally initiated messages that are accepted by the blockchain will produce a unique normalized hash per trace.

Therefore, for dApps that interact with user wallets via TON Connect—or for services such as exchanges that have full control over their outgoing external messages and can ensure the above conditions are met—it is safe to reference traces using the normalized hash. This holds even before the transactions are finalized, making it suitable for use in user-facing explorer links or transaction tracking tools.

# Drawbacks

- Implementing the normalized message hash introduces additional computation overhead during message processing. However, this overhead is minimal and is outweighed by the benefits of improved transaction tracking and deduplication.

# Rationale and Alternatives

The primary rationale for this proposal is to address the inconsistencies in message hashing due to non-essential fields. By standardizing these fields during hash computation, we achieve a consistent identifier for external-in messages.

An alternative approach could involve change of wallet signing protocol, such as signature covers all fields, which will prevent malleability.
This potentially will make wallet operation more expensive.
This approach can be used in the future, however we still need mechanisms for existing ~40'000'000 wallets.

Currently there are still a few fields that can be changed. In particular destination address of the external message can be encoded in different format (`addr_std`/`addr_var`) and contain optional fields such as `anycast`. It is expected that in near future both `addr_var` and `anycast` fields will be forbidden in external messages (and largely in internal messages as well), thus no additional rules for this fields are proposed.

# Prior Art

First implementation, which basically formalized in this TEP was implemented by Tonapi/TonKeeper team: [tonkeeper/tongo#313](https://github.com/tonkeeper/tongo/pull/313) and later used in node [ton-blockchain/ton#1557](https://github.com/ton-blockchain/ton/pull/1557).
