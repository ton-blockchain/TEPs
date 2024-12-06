**TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*

**Title**: Extended NFT Standard with Collection Proof

**Status**: Draft

**Type**: Contract Interface

**Authors**: Mahdi Bagheri

**Created**: 26.9.2024

**Extends**: [TEP-62](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md)

**Replaces**: -

**Replaced by**: -

# Summary
This TEP proposes an extension to the existing NFT standard (TEP-62) to introduce a new operation named get_real_static_data. This operation allows verification of an NFT's collection membership.

# Motivation
The current NFT standard lacks a mechanism for a smart contract to definitively verify that an NFT belongs to a specific collection. While get_static_data in individual NFT contracts reveals the collection address, it doesn't guarantee the NFT's authenticity within that collection.

This extension addresses this limitation, enabling secure verification of collection membership for various use cases, such as:

* Marketplaces ensuring NFTs belong to advertised collections before listing.
* Games or applications verifying NFT ownership within a specific collection for access or functionality.
* Decentralized exchanges (DEXs) verifying NFTs as collateral for loans or other financial operations.

# Problem:

In the current NFT standard, a smart contract cannot definitively verify if an NFT belongs to a specific collection.

# Solution:

This TEP introduces a new operation named `get_real_static_data` within the NFT standard. Here's how it works:

1. The requester smart contract sends a message to the individual NFT contract with the `get_real_static_data` operation.
2. The individual NFT contract forwards the request message alongside requester address to the collection contract address stored internally.
3. The collection contract verifies if the request originated from a valid NFT within its collection (using internal mechanisms).
4. The collection contract verifies the request's origin and sends a response to the proof requester. The response includes the `query_id` from the original request, the `index` of the NFT within the collection, the `nft_address` of the NFT itself, and the `owner_address` of the NFT. The requester can verify that the NFT belongs to the specified collection by checking the `index`, `nft_address`, and `owner_address` against the collection's records.

# Benefits:

* Enables secure verification of NFT collection membership for various applications.
* Improves trust and security in NFT-based ecosystems.

# Specification
This section defines the technical details of the proposed extension.

### NFT Smart Contract:

New Internal Message `get_real_static_data` (request):

**should do:**

1. Send a message to the collection with the following layout and send-mode `64` (return msg amount except gas fees):
   TL-B schema: `get_real_static_data#7a250735 query_id:uint64 index:uint256 owner_address:MsgAddress`
   `index` - numerical index of this NFT in the collection, usually serial number of deployment.
2. Collection validates NFT request and throws an error if NFT does not belong to the collection. otherwise the collection will send a message with the following layout and send-mode `64`.
    TL-B schema: `provide_static_data#3b65c862 query_id:uint64 index:uint256 nft_address:MsgAddress owner_address:MsgAddress`

### Verification of Request Origin:

The collection contract should implement a mechanism to verify that the get_real_static_data request originates from a valid NFT within its collection. This can be achieved using methods like `calculate_nft_address` Checking if the nft_address in the request belongs to a deployed NFT within the collection.

# Drawbacks
There is a slight increase in message traffic compared to the basic `get_static_data` operation. However, this is a minimal trade-off for the enhanced security and verification it provides.

# Rationale and Alternatives
This approach balances security with efficiency. Alternative methods, like relying solely on get_static_data, lack the necessary verification component.

# Prior Art
This TEP builds upon the existing NFT standard (TEP-62) and leverages concepts from verification methods used in jetton standart.
