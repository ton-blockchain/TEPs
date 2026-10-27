- **TEP**: [370](https://github.com/ton-blockchain/TEPs/pull/370) *(don't change)*
- **title**: Transaction chains friendly fees update mechanism
- **status**: Draft
- **type**: Core
- **authors**: [Emelyanenko Kirill](https://github.com/EmelyanenkoK)
- **created**: 24.11.2024
- **replaces**: -
- **replaced by**: -

# Summary

Propose a mechanism to update fees without disrupting currently executing chains of transactions.

# Motivation

Because execution on TON is asynchronous, updating network configurations can cause the conditions under which execution started to differ from those at the end of execution. This is critical in the case of transaction fee increases, as the funds reserved at the beginning of the transaction may become insufficient not only for proper completion but even for error handling.

# Specification

Modify the TON Virtual Machine (TVM) so that during fee calculation, it checks the `msg_envelope_v2` of the incoming message (see [Dispatch Queue](https://github.com/ton-blockchain/TEPs/blob/master/text/0160-dispatch-queue.md)) and retrieves the `initiator_lt` and `depth` parameters.

For messages with a limited depth (e.g., below `1024` to prevent intentionally infinite chains), fees are calculated according to the conditions that were in place when the chain started. This affects calculations at the TVM level, including special opcodes like `GETGASFEE` (see [TVM Upgrade 2024.04](https://docs.ton.org/v3/documentation/tvm/changelog/tvm-upgrade-2024-04#opcodes-to-process-config-parameters)) and gas-related configuration parameters available in `c7`.

While correct protocol execution still requires calculating necessary fees for operations according to the current configuration parameters, this approach eliminates the need to account for sudden changes in configuration parameters while operations are in process.

# Drawbacks

1. **Validator Overhead**: Validators will need to remember and verify configuration parameters that existed in the past. Note that the chain depth limitation may not directly translate to a time limitation.

2. **Complicated Config Management**: Modifying certain configuration parameters in `c7` while keeping others (unrelated to gas) untouched during execution can be complex and may introduce potential errors.

3. **Complicated emulation**: proper historical emulation like [Retracer](retracer.ton.org) or TVM replay, as well as pending transaction chains emulation become more cumbersome: we need to retieve message envelop and historical config.

# Alternatives

- **Static Gas Parameters**: Avoid changing gas parameters altogether to maintain consistency.

- **Config Update Mode**: Implement a "config update mode" for the blockchain—a period during which new external messages are not accepted, allowing all chains of reasonable length to finish. The configuration would be updated at the end, prior to starting new chains.

# Unresolved Questions

- **Storage of Old Config Params**: How and for how long should old configuration parameters be stored and proven (e.g., collator proves to validator in `collated_data`)?

- **Modification Scope**: Should we modify `c7`, or would it be better to only change TVM execution and the behavior of gas-related opcodes?

- **Chain Depth Limit**: What should the chain depth limit be for applying old fees?

- **Fee Decrease Scenario**: In the case of a fee decrease, do we want to keep the old (higher) fees for running chains?
