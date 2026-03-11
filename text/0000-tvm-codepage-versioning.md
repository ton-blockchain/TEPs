- **TEP**: [582](https://github.com/ton-blockchain/TEPs/pull/582)
- **title**: TVM codepage-based versioning
- **status**: Draft
- **type**: Core
- **authors**: [Andrey Pfau](https://github.com/andreypfau)
- **created**: 11.03.2026
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggests adopting TVM's codepage mechanism — originally designed in the whitepaper but never used — as the primary versioning mechanism for TVM instruction set changes, instead of the current `global_version` runtime checks.

# Motivation

TVM currently has two versioning mechanisms:

1. **Codepages** (whitepaper §5.1) — a per-continuation 16-bit field `cp` that selects which opcode table is used to decode instructions. Every continuation carries its own codepage. The whitepaper describes this as "an essential mechanism of backward compatibility and of future extensions to TVM." Instruction `SETCP n` (`0xFF nn`) is reserved across all codepages for switching.

2. **`global_version`** (ConfigParam 8) — a global integer bumped by validator vote. C++ opcode handlers check `get_global_version()` at runtime to gate behavior changes.

In practice, only `global_version` is used. Codepages are dead code — only `cp0` ("TEST CODEPAGE") exists in the C++ implementation. This has led to several problems:

### Problem 1: Breaking deployed contracts

`global_version` changes the behavior of **all** contracts simultaneously. When a version bump modifies opcode semantics, every already-deployed contract is affected, whether the author intended it or not.

Examples from the version history:
- **v10**: `LDMSGADDR`, `PARSEMSGADDR`, `REWRITESTDADDR`, `REWRITEVARADDR` stopped supporting anycast addresses — any deployed contract using these with anycast broke silently
- **v13**: `AND`, `OR` changed NaN handling — `0 AND NaN` returned `0` before v13, returns `NaN` after v13

With codepages, a contract declares `SETCP 0` and its behavior is frozen forever. New semantics live in `SETCP 1`.

### Problem 2: Scattered version gates

The C++ codebase is littered with `if (get_global_version() >= N)` checks — each one a potential source of bugs. The QPOW2 inconsistency ([#2198](https://github.com/ton-blockchain/ton/issues/2198)) is a direct result: commit [`99e88ed`](https://github.com/ton-blockchain/ton/commit/99e88ed069bfeac06e316bc51e8d1b17cf3c8b3f) added v13 quiet relaxation to `LSHIFT`, `RSHIFT`, `MULRSHIFT`, `LSHIFTDIV`, `AND`, `OR` but missed `POW2`, because there is no structural mechanism ensuring completeness.

With codepages, each codepage is a complete, self-contained opcode table. There are no conditional branches — either an opcode is in the table or it isn't.

### Problem 3: No per-contract opt-in

There is no way for a contract to say "I was written for TVM v4 semantics, please don't change my behavior." The only option is to never upgrade `global_version`, which blocks all contracts from getting new features.

Ethereum has the same problem (hard forks change all contracts), but Ethereum opcodes are designed to be semantically stable — behavior changes are extremely rare and go through extensive EIP review. TON has been changing opcode semantics much more frequently (v4, v8, v10, v13 all modified existing instruction behavior).

### Problem 4: The whitepaper mechanism exists and is elegant

The codepage mechanism was carefully designed:
- Each continuation stores `cp`, so cross-codepage calls work transparently (§5.1.1)
- `SETCP n` is reserved with the same encoding in all codepages (§5.1.8)
- Negative codepages are reserved for restricted TVM modes (§A.13)
- The dispatch table infrastructure already exists in C++ (`dispatch.cpp`)

It would be a waste to ignore this design and keep accumulating version gates.

# Guide

### For smart contract developers

Today, a contract's code is interpreted identically regardless of when it was deployed. If validators bump `global_version` from 12 to 13, your contract's `AND` instruction silently changes behavior.

With this proposal, contracts explicitly declare their TVM version:

```
SETCP 1    ;; This contract uses codepage 1 (TVM v4+ features)
;; ... contract code ...
```

If you don't add `SETCP`, your code runs on codepage 0 with the original frozen semantics. You opt into new features by choosing the appropriate codepage.

### Compiler integration

The Tolk compiler already has a version declaration mechanism similar to Solidity's `pragma`:

```tolk
tolk 1.2
```

This declares the compiler version the source was written for. Currently this only affects compiler-level behavior. With this TEP, the version declaration would also determine the target codepage — the compiler emits the appropriate `SETCP n` instruction at the beginning of the generated code.

For example, a future Tolk version could map its language version to a TVM codepage:

```tolk
tolk 2.0    // compiler emits SETCP 1 → TVM codepage 1
```

This is directly analogous to Solidity's `pragma solidity ^0.8.0`, which determines which EVM opcodes the compiler may use — except with codepages, the **runtime** also enforces the version boundary, not just the compiler.

Note: FunC and Tact are considered legacy compilers. Tolk is the officially recommended compiler for TON smart contracts going forward, and it is the only compiler that needs first-class codepage support. Legacy compilers may add `SETCP` support at their maintainers' discretion — contracts compiled without `SETCP` will continue to work on the default codepage.

### For VM implementors

Instead of:
```cpp
int exec_and(VmState* st, bool quiet) {
  // ...
  if (st->get_global_version() >= 13 && (!x->is_valid() || !y->is_valid())) {
    result = td::nan_refint();
  } else {
    result = std::move(x) & std::move(y);
  }
  // ...
}
```

You register two separate handler functions in two codepage tables:
```cpp
// Codepage 0: original behavior
int exec_and_cp0(VmState* st, bool quiet) {
  auto result = std::move(x) & std::move(y);
  stack.push_int_quiet(std::move(result), quiet);
}

// Codepage 5: v13 NaN-aware behavior
int exec_and_cp5(VmState* st, bool quiet) {
  if (!x->is_valid() || !y->is_valid()) {
    result = td::nan_refint();
  } else {
    result = std::move(x) & std::move(y);
  }
  stack.push_int_quiet(std::move(result), quiet);
}
```

Each codepage is a complete opcode table with no runtime conditionals.

### Cross-codepage interaction

When contract A (codepage 1) calls contract B (codepage 0), contract B runs with codepage 0 semantics. This is already how TVM continuations work — each continuation carries its own `cp` field, and switching to a new continuation loads its codepage (whitepaper §5.1.2).

# Specification

> The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 1. Codepage registry

Each codepage is identified by a signed 16-bit integer. The following codepages are defined:

| Codepage | Name | Description |
|----------|------|-------------|
| 0 | `cp0` | Original TVM as specified in the whitepaper. Frozen, no further changes. |
| 1 | `cp1` | Equivalent to current `global_version >= 4` behavior (new opcodes: ECRECOVER, SENDMSG, HASHEXT, BLS, RIST255, RUNVM, etc.) |
| 2 | `cp2` | + `global_version >= 5..6` changes (library loading, fee calculation ops, cell level ops) |
| 3 | `cp3` | + `global_version >= 7..9` changes (PFXDICT underflow fix, SETCONTCTRMANY, etc.) |
| 4 | `cp4` | + `global_version >= 10..12` changes (address restrictions, BTOS, LDSTDADDR, etc.) |
| 5 | `cp5` | + `global_version >= 13` changes (quiet NaN relaxation for LSHIFT/RSHIFT/AND/OR + POW2 fix) |
| -14 | `exp` | Experimental, not guaranteed to be stable across implementations |
| -13..-1 | reserved | Reserved for restricted TVM modes (whitepaper §A.13) |

Future TVM changes SHALL be introduced as new codepages rather than version gates.

The exact grouping of `global_version` changes into codepages is open for discussion — the above is one possible mapping.

## 2. Codepage table structure

Each codepage SHALL be a complete, self-contained `OpcodeTable` — a mapping from opcode prefix to handler function. There SHALL be no `get_global_version()` checks inside opcode handlers.

Codepages MAY share handler functions for opcodes whose behavior is identical. Only opcodes with changed semantics need separate handlers.

## 3. Codepage selection

A smart contract SHOULD begin its code with `SETCP n` to declare which codepage it targets.

If a contract does not begin with `SETCP`, it runs on codepage 0 (backward compatible with all existing contracts).

## 4. Continuation semantics

When a continuation is created (via `PUSHCONT`, `BLESS`, or similar), it SHALL inherit the current codepage, as specified in the whitepaper §5.1.1.

When a continuation is jumped to or called, the VM SHALL set the current codepage to the continuation's `cp` field before executing its code.

## 5. Global version interaction

During the transition period, `global_version` SHALL remain as the mechanism for non-TVM consensus changes (action phase behavior, storage phase, message format, etc.).

For TVM opcode changes, `global_version` bumps SHALL only be used to enable support for new codepages (i.e., "validators now recognize codepage N"), not to change opcode behavior within existing codepages.

## 6. Migration of existing contracts

### The problem

All contracts currently deployed on TON mainnet run on codepage 0, but their actual behavior is defined by the *mutated* cp0 — the result of 13 successive `global_version` bumps. These contracts:

- Were compiled without `SETCP` (the instruction exists but no compiler emits it)
- Rely on opcodes added in later versions (e.g., `ECRECOVER` from v4, `SENDMSG` from v4, `BTOS` from v12)
- Depend on behavioral changes introduced by version gates (e.g., v4 division `d=0` add mode, v10 address restrictions)

A naive "freeze cp0 = original whitepaper" approach would break every contract that uses any post-launch feature.

### Solution: legacy codepage

The current mutated cp0 behavior (with all version gates resolved to their `global_version == 13` state) SHALL be captured as a **legacy codepage** — effectively a snapshot of "TVM as it works today."

Two options for the codepage number:

**Option A: cp0 = legacy (recommended)**
- Codepage 0 is defined as the current v13 behavior, not the original whitepaper
- Existing contracts (which have no `SETCP`) continue to work unchanged
- The original whitepaper semantics are not preserved as a codepage (they were never actually deployed)
- New codepages (cp1, cp2, ...) extend from this baseline
- This is the pragmatic choice — no migration needed for any existing contract

**Option B: cp0 = whitepaper, high codepage = legacy**
- Codepage 0 is frozen to original whitepaper semantics
- A new codepage (e.g., cp13) captures the current v13 mutated behavior
- The default codepage for contracts without `SETCP` is changed from cp0 to cp13 via a `global_version` bump
- More architecturally pure, but requires a coordinated migration

### What changes for existing contracts

Under Option A (recommended):

| Contract type | Current behavior | After this TEP |
|---|---|---|
| Deployed without `SETCP` | Runs on cp0 with v13 version gates | Runs on cp0 = frozen v13 snapshot. **No change.** |
| Deployed with `SETCP 0` (none exist today) | Same as above | Same as above |
| New contract targeting latest features | Compiled for cp0, gets v13 behavior | Compiled with `SETCP 1`, gets cp1 features |

The critical invariant: **no existing contract changes behavior**. The `global_version` that activates this TEP freezes cp0 at its current state and makes new codepages available. From that point on:

- cp0 is immutable — no future `global_version` bump changes it
- New TVM features are added only to new codepages
- Compilers emit `SETCP n` targeting the desired codepage

### Historical replay and version gates

A full node or archival validator MUST be able to replay every transaction from the genesis block to verify the chain. This means all historical `global_version` behaviors must remain reproducible.

The current `global_version` version gates in opcode handlers **cannot simply be removed** from cp0. Consider the replay sequence:

1. Block at `global_version == 3` → contract executes `AND` with NaN → must return absorbing element (pre-v13 behavior)
2. Block at `global_version == 13` → same contract, same opcode → must return NaN (v13 behavior)
3. Block after this TEP activates → same contract on cp0 → must behave like v13 (frozen snapshot)

All three behaviors must coexist in the same binary. Therefore:

**Option 1: Keep version gates for replay, codepages for new execution**

The `global_version` version gates remain in the codebase for historical replay. Codepage tables are used only for blocks after the activation point. The VM checks:
- If block's `global_version` < activation version → use legacy dispatch with version gates (as today)
- If block's `global_version` >= activation version → use codepage dispatch

This is the simplest approach and requires no changes to historical replay logic. The downside is that version gates remain in the code forever, but they are only exercised during historical sync, not during live block production.

**Option 2: Map historical versions to codepages retroactively**

Create codepages for every historical behavior:
- cp0v0 = original whitepaper behavior (global_version 0–3)
- cp0v4 = after v4 changes
- cp0v5 = after v5 changes
- ... and so on

During replay, the VM selects the codepage corresponding to the block's `global_version`. This fully eliminates version gates but requires building ~13 codepage tables. Each table is a complete snapshot of TVM behavior at that version.

This is architecturally cleaner but significantly more work. It could be done incrementally — start with Option 1 and gradually extract historical versions into codepage tables.

**Option 3: Archival nodes use legacy code path, validators use codepages**

Since historical replay is only needed during initial sync (not during live validation), the legacy version-gated code path can be maintained as a separate "replay mode." Live validators use codepage dispatch exclusively.

### Recommendation

Option 1 is recommended for the initial implementation. The key benefit of this TEP is preventing **future** accumulation of version gates, not retroactively cleaning up existing ones. The existing version gates are tested, working, and only affect historical replay performance.

The practical outcome:
- `cp0` handler = current code with version gates intact (handles both live execution at v13 and historical replay at v0–v12)
- `cp1`, `cp2`, ... = clean codepage tables with no version gates (new features only)
- Future TVM changes never touch the cp0 handler — they go into new codepages

## 7. Minimum supported codepage

A new ConfigParam (or an extension of ConfigParam 8) MAY define the minimum codepage that contracts must use for **new deployments**. This allows the network to eventually stop accepting new contracts on old codepages.

Already-deployed contracts on deprecated codepages SHALL continue to execute — only new deployments are restricted. This mirrors how programming languages deprecate old versions: existing binaries keep running, but you can't compile new code against the old standard.

# Drawbacks

- **Migration complexity**: Existing `global_version` checks in the C++ code would need to be refactored into separate codepage tables. This is a large but mechanical change.
- **Multiple opcode tables**: Memory usage increases with each codepage. However, most opcodes are identical across codepages, so tables can share handler pointers. The overhead is minimal.
- **Compiler changes**: Tolk already has a version declaration (`tolk 1.2`) that would need to be extended to map language versions to codepages. Legacy compilers (FunC, Tact) are not required to add support — their output will run on the default codepage.
- **Testing surface**: Each codepage is a separate configuration to test. However, this is already the case with `global_version` — codepages just make it explicit and structured.
- **Cannot force bugfixes on old contracts**: If codepage 0 has a bug, contracts on codepage 0 keep the bug. This is by design — it's the same tradeoff as Ethereum's "code is law." Critical security fixes could still use a global mechanism if absolutely necessary.
- **Historical replay requires version gates**: The existing `global_version` checks in cp0 cannot be removed because archival nodes must replay transactions from genesis with the exact behavior of each historical version. This means cp0 remains a "version-gated monolith" internally. The benefit of this TEP is preventing new version gates from accumulating — it does not clean up old ones.

# Rationale and alternatives

### Why codepages instead of global_version?

| Aspect | `global_version` | Codepages |
|--------|------------------|-----------|
| Scope | Global, affects all contracts | Per-contract opt-in |
| Backward compat | Can break deployed contracts | Frozen codepages never change |
| Code quality | Scattered `if (version >= N)` | Clean, separate opcode tables |
| Bug surface | Easy to miss opcodes (QPOW2) | Complete table, nothing to miss |
| Testability | Must test N×M combinations | Each codepage is independent |

### Why not just be more careful with global_version?

The QPOW2 bug shows that the current approach is structurally fragile. The developer who added the v13 relaxation touched 6 opcodes in one commit but missed the 7th. With codepages, this class of bug is impossible — you build a complete opcode table, and either POW2 is in it or it isn't.

### Why not per-contract version field (like Solidity pragma)?

This is essentially what codepages are, but more powerful:
- Codepages are part of the instruction stream, not external metadata
- Cross-codepage calls work transparently via continuations
- The mechanism already exists in TVM's architecture

### What about Ethereum's approach?

Ethereum uses global hard forks and accepts that deployed contract behavior can change. However:
- Ethereum very rarely changes existing opcode semantics (most EIPs add new opcodes or change gas costs)
- When they do (e.g., EIP-3529 reducing SELFDESTRUCT refund), it goes through extensive review
- TON has been changing opcode semantics much more frequently

# Prior art

- **JVM**: Uses `class file version` (major.minor) — each class declares its version, and the JVM interprets bytecode accordingly. New versions can add instructions and change verification rules without affecting old classes. Directly analogous to codepages.
- **WebAssembly**: Uses feature proposals with per-module opt-in. A WASM module declares which features it uses. The runtime validates that it supports those features before execution.
- **RISC-V**: Uses ISA extension versioning (RV32I v2.1, M extension v2.0). Each extension has Ratified/Frozen/Draft status. Software declares which extensions it requires.
- **Ethereum**: Uses global hard forks (Homestead, Byzantium, Istanbul, etc.). All contracts change simultaneously. No per-contract versioning.
- **Solidity**: Uses `pragma solidity ^0.8.0` for compiler version. The compiler generates different bytecode, but the EVM itself has no version awareness.

# Unresolved questions

1. **Exact codepage-to-version mapping**: Should each `global_version` bump get its own codepage, or should related changes be grouped? The proposal above groups them, but 1:1 mapping is also viable.
2. **Deprecation policy**: Should there be a mechanism to deprecate old codepages (prevent new deployments on cp0)? How long should deprecated codepages remain executable?
3. **Non-opcode changes**: `global_version` also gates non-TVM changes (action phase, storage phase, message format). These would remain global. Is the boundary between "TVM opcode behavior" and "transaction processing" always clear?
4. **Gas cost changes**: When gas costs change between codepages, should the contract pay the gas cost of its codepage or the current network codepage? Codepage-specific gas seems correct (contract opted into those costs), but this needs careful analysis.
5. **Library cells**: Libraries are shared code. If a library is written for cp0 and called from a cp3 contract, the library runs on cp0 (its continuation's codepage). Is this always desirable?

# Future possibilities

- **Codepage-aware compilers**: Tolk/Tact could target specific codepages and warn when using features not available in the selected codepage.
- **Optimized encodings**: As envisioned in the whitepaper §5.1.5, future codepages could reassign shorter opcodes to frequently-used instructions based on real-world usage data.
- **Context-dependent codepages**: The whitepaper §5.1.6–5.1.7 describes using multiple codepages within a single program for improved code density or as status flags. This becomes possible once the codepage infrastructure is active.
- **Formal verification per codepage**: Each codepage is a fixed, complete specification — ideal for formal verification. A codepage can be verified once and its correctness holds forever.
