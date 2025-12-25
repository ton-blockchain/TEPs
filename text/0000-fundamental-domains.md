- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Fundamental Domains
- **status**: Draft
- **type**: Core
- **authors**: [Ender Ting](https://github.com/ProgramCrafter)
- **created**: 22.10.2025
- **replaces**: -
- **replaced by**: -

# Summary

Fundamental Domains are custom domains in `.ton` zone, which allow to read blockchain information through the proxy used to access TON Sites instead of a centralized service.

# Motivation

This TEP introduces a way for dApps, even website ones which can only do HTTP requests, to be independent of centralized explorer APIs. In particular, adoption of this standard makes it vastly easier to run dApps in one's private TON-based network, since one would just run proxy application against that blockchain.

# Guide

Make TON proxy applications share their blockchain access with dApps loaded through them, through `explor.er.ton` domain.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

An application for TON DNS proxying SHALL provide custom resolution and service for every Fundamental Domain. This TEP defines `explor.er.ton` as a Fundamental Domain; applications are RECOMMENDED to hold any other subdomain of `er.ton` reserved.

This API of `explor.er.ton` MUST mirror Toncenter-style RPC by providing the following methods:

* `/tcev2/getAddressInformation` (address, seqno)
    - The proxy MUST also support alias `mc_height` == `seqno`.
* `/tcev2/getTransactions` (address, limit, lt+hash, to_lt)
    - The proxy MUST also support aliases `earliest_lt` == `to_lt`, `latest_lt` == `lt`, `latest_hash` == `hash`.
    - Support for retrieval of archival transactions is OPTIONAL.
* `/tcev2/getMasterchainInfo`
* `/tcev2/getMasterchainBlockSignatures` (seqno)
    - The proxy MUST also support alias `mc_height` == `seqno`.
* `/tcev2/getShardBlockProof` (workchain, shard, seqno, from_seqno)
    - The proxy MUST also support aliases `height` == `seqno`, `mc_reference_height` == `from_seqno`.
* `/tcev2/getConsensusBlock`
* `/tcev2/lookupBlock` (workchain, shard, seqno, lt, unixtime)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/getBlockTransactions` (workchain, shard, seqno, root_hash, file_hash, after_lt, after_hash, count)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/getBlockTransactionsExt` (workchain, shard, seqno, root_hash, file_hash, after_lt, after_hash, count)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/getBlockHeader` (workchain, shard, seqno, root_hash, file_hash)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/getLibraries` (libraries)
* `/tcev2/getOutMsgQueueSizes`
* `/tcev2/tryLocateResultTx` (source, destination, created_lt)
* `/tcev2/tryLocateSourceTx` (source, destination, created_lt)
* `/tcev2/getConfigParam` (config_id, seqno)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/getConfigAll` (seqno)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/runGetMethod` (address, method, stack, seqno)
    - The proxy MUST also support alias `height` == `seqno`.
* `/tcev2/sendBoc` (boc)
* `/tcev2/jsonRPC`

# Drawbacks

* Complicating domain resolution process.
* Creating a DNS pseudo-entry which cannot be undelegated or otherwise modified by validators anymore.
* Requirement to implement a large API surface, some implementations of which are virally licensed, can be a large obstacle to proxy apps.

# Rationale and alternatives

## Why `er.ton` specifically?

TON DNS collection only auctions domains three or more characters long. Therefore, `er.ton` is unused, as well as being suffix for "indexer" and "explorer" both.

## Subset of chosen methods

Most of the required methods are already needed to implement DNS resolution, from config loading to get-method evaluation.

# Unresolved questions

1. Shall we also provide APIs based on `tonapi.io`, `dton.io`?

# Future possibilities

- `index.er.ton` providing aggregated data about blockchain.
