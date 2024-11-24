- **TEP**: [160](https://github.com/ton-blockchain/TEPs/pull/160)
- **title**: Dispatch Queue
- **status**: Implemented
- **type**: Core
- **created**: 13.06.2024
- **replaces**: -
- **replaced by**: -

# Summary
From user perspective TON functions as a multithreaded distributed operating system for decentralized applications (dApps). As any operation system TON implements scheduling mechanism for balancing resource consumption across multiple dApps. Previously this balancing was primarly based on sharding, that is moving resource-intensive processes to separate shard, however now we propose to add on top of sharding level balancing, additional introshard balancing, that will prevent a resource monopolization by single dApp that could lead to performance issues for other dApps on the same shard. In particular we propose to add additional intermediate queue between smart-contract and OutMsgQueue - the Dispatch Queue. This intermediate Queue will allow to schedule messages for processing in more distributed manner.

# Motivation

For now the only mechanism of load distribution is sharding: if some shard has too much load it may be divided to two sub-shards. While this indeed helps, there are limitations that sometimes make this mechanims not ideal on practice: finite (and relatively large) time of split/merge of shards, edgecases when load is unevenly distributed inside shard, split limit in network configuration (to make some other node mechanisms predictable) etc. This may affext user experience, in particular predictability and smoothness, since time of chain of transactions execution is dependent on other protocols simultaneously running in the network. The goal of this proposal to better distribute the load and prevent resource monopolization by single, instead providing more predictable execution time for all users and protocols.

# Guide

## Dispatch Queue
To balance load, we introduce an additional mechanism called the _Dispatch Queue_. When contract sends a message, it may either enter the Dispatch Queue (before the Collator moves some messages from the Dispatch Queue to the OutMsgQueue later on block collation) or directly enter OutMsgQueue. This intermediate step allows for a more even distribution of load among all dApps running in parallel.

The Dispatch Queue is organized as a set of outgoing message queues for each account. When the collator forwards messages to the OutMsgQueue, it maintains lt-order: a message from Account A with `lt1` will move to the OutMsgQueue before a message from Account A with `lt2` if `lt1 < lt2`. However, this order is not maintained for messages from different accounts. For example, a message from Account A with `lt1 > lt2` may be processed before a message from Account B with lt2 if there is a significant backlog of messages from Account B.

This logic is not new to TON; it previously operated at the inter-shard level: if Shard1 had a large number of incoming messages, it could fall behind in `lt` compared to Shard2, which would process all its messages without waiting for lt-parity with Shard1.

With the Dispatch Queue, we extend this behavior to the (virtual) AccountChain level, effectively unlocking fully parallel running of individual AccountChains inside ShardChains!

Another crucial rule is that the first message from a transaction (given there is no dispatching queue for the sending address) goes directly to the OutMsgQueue. This means contracts implementing a 1-message-in-1-message-out transaction logic avoid message dispatching.



# Specification

## TLB scheme changes:
Added
- `msg_envelope_v2` constructor for `MsgEnvelope` with `metadata` and `deferred_lt`
- `msg_metadata#0 depth:uint32 initiator_addr:MsgAddressInt initiator_lt:uint64 = MsgMetadata;`
- new `InMsg` and `OutMsg` constructors for messages that came in and out from DispatchQueue
- `dispatch_queue` field to `OutMsgQueueInfo` that effectively contains `mapping{Account->mapping{lt->Message}}` with augmentation that allows effecient message lt-ordering.

## Guarantees and Protocol Development Impact
If your protocol processes incoming messages without extensive transaction-graph branching, you will generally remain unaffected. However, if your protocol includes significant branching, some branches may be distributed over time to avoid interfering with other dApps operating within the same shard.

For example, in scenarios like `A-(m1)->B | A-(m2)->C | C-(m3)->B`, under low sharding, the process remains unchanged: `m1` will reach B earlier than `m3`. This holds because messages from A will always reach the OutMsgQueue of A's shard in lt order: first `m1`, then `m2`. And if shards A', B', and C' are neighbors, C's shard cannot process `m3` with lt strictly higher than `m1` first.

Currently, the TON network is configured so that all shards are neighbors. However, given the rapid user base growth, we must consider dapp protocol changes for a future with more than 16 shards, where a message from A to B may pass through an intermediate hop (see hypercube routing).

In such cases, each side of the triangle `A-(m1)->B | A-(m2)->C | C-(m3)->B` may include more edges: `A-(m1)->B` could become `A-(m1)->[Intermediate hop]-(m1)->B`, transforming the triangle into a polygon with less predictable order. If your protocol requires strict ordering, it can be achieved through an additional "synchronization" account S, as messages from S to B will be processed in the order they were sent from account S.

## Additional Features
With introduction of dispatch queue we additionally extend message envelopes (structures that wrap messages during routing in TON) to contain metadata such as the original transaction ID (in the form of `initiator_addr:MsgAddressInt initiator_lt:uint64`) and depth in the graph. This helps indexers manage very large transaction chains (sometimes called "traces").

# Drawbacks

1. This is significant and deep change of how node process messages that adds additional complexity.
2. This introduce some (but limited, and it may be limited further) way for collators to reorder and prioritize some messages, that open possibilities of MEV, which may be considered controversial.


# Rationale and alternatives

Despite being quite significant, Dispatch Queue actually doesn't affect behavior of all other parts of the system, because validators continue to import messages from OutMsgQueue the same way, sharding works the same way etc.

Among alternatives we considered message postponement inside OutMsgQueue which, howver, requres more significant changes on sharding/collation levels and also has less flexibility.

# Future possibilities

Dispatching rules, the rules of in which order messages from Dispatch QUeue goes to OutMsgQueue, maybe developed further to better suit practcal needs. This changes won't require consensus. Some additional fields in the metadata were added to give collator more context during dispatching (it probably won't be used in the first implementation). Besides it is possible that in the future som of metadata, in particular `initiator_addr` may be done accessible to TVM runtime.
