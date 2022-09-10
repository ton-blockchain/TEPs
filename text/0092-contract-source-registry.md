- **TEP**: [91](https://github.com/ton-blockchain/TEPs/pull/91)
- **title**: Contract Source Registry
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Tal Kol](https://github.com/talkol), [Shahar Yakir](https://github.com/shaharyakir), [Doron Aviguy](https://github.com/doronaviguy)
- **created**: 09.09.2022
- **replaces**: -
- **replaced by**: -

# Summary

This standard defines decentralized infrastructure and an on-chain registry to store the source code for verified TON smart contracts.

The standard also defines a simple permissionless protocol where community source code verifiers could register and publish signed attestations that they have indeed verified specific contracts.

# Motivation

Like many other blockchains, TON blockchain stores smart contracts on-chain as compiled TVM bitcode which is not human-readable.

TON follows the general principle that "code is law". Users who participate in a smart contract by sending it transactions or depositing funds, effectively agree to the terms coded in this smart contract. In the traditional world, nobody would expect users to sign a binding legal agreement written in a language that they cannot read. This is not very different, as the on-chain bitcode is insufficient to educate participants about the implied terms of agreement.

TON smart contracts normally originate from higher level languages such as FunC which are human-readable and have been compiled. Since these source files are sufficient to educate participants, offering a well-known registry where they can be located will benefit the community. Making sure that this infrastructure is decentralized would guarantee that this critical resource is always available to anyone under equal access.

# Guide

The standard covers interactions between the relevant stakeholders in the community:

* **Contract developers** - Any developer who writes contract source code, compiles it and deploys on-chain. These developers do not necessarily bother with publishing the source code or paying for it to be verified.
* **Source-code uploaders** - Any community member that has access to source code that matches an on-chain code cell and is interested in publishing this source code and paying for its verification. This is not necessarily the deployer of the contract.
* **Source-code verifiers** - A permissionless group of community validators that are performing a validation process to check that a specific source-code yields the required compiled on-chain result and publish signed attestations towards this.
* **Source-code displayers** - These would normally be explorers (see https://ton.app/explorers) that display the verified source-code to their users by incorporating a widget in their websites.
* **End users** - Consumers that want to see the verified source code for a specific contract address. They would normally visit one of the *source-code displayers* and query it to witness the validators' verification attestations and maybe even audit them by verifying locally.

The standard relies on the following services to store data:

* **IPFS migrated to TON Storage when released** - Used to store the human-readable source-code files and attestations. This medium is required due to the potentially large size of source-code that may become too expensive to store on-chain.
* **On-chain registry contracts** - Contracts deployed to TON mainnet that map code hash values of various contracts to the IPFS/TON Storage URL that holds the sources of these contracts. A different registry contract lists all active verifiers and their public keys.

The standard puts emphasis on keeping all stakeholders equal and storing all data on neutral ground.

## Inspiration mock-ups for user facing aspects

1. [Link on ton.org to verify a contract](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_30)
2. [User enters contract address to see verified source](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_10)
3. [Verified source-code is displayed to user](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_6)
4. [User wants to see the proofs published by verifiers](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_14)
5. [Verified source-code embedded inside tonscan.org explorer](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_18)
6. [Verified source-code embedded inside TonWhales explorer](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_22)
7. [Working demo showing the client for publishing and verifying sources](https://ton-defi-org.github.io/ton-src-webclient/EQDerEPTIh0O8lBdjWc6aLaJs5HYqlfBN2Ruj1lJQH_6vcaZ)

# Specification

Due to the large number of moving parts, the specification at this stage does not go into the full details of exact interfaces or TL-Bs. These parts will be added for community discussion in a later stage.

## General

* Contract sources are indexed by code hash and not by contract address. This means that several deployed instances of the same smart contract code will only need to be registered once.

* If a smart contract supports code updates, once its code is changed, the new code hash will no longer be found in the registry until a source code matching the new code hash is uploaded.

* IPFS is used as a **temporary** form of storage only until TON Storage is released. All participants commit to performing a full migration of all verified sources to TON Storage when possible.

* A single participating **verifier** runs a backend that exposes HTTP API that receives a list of source files, compiles them and returns a signed proof over the resulting code hash. The public key for this verifier is registered in the verifier registry contract.

* To encourage redundancy of verifiers, each verifier is encouraged to run multiple backend instances, each with its own public key. Verification then requires a quorum of backends to work and not all of them, for example 3 out of 5. This is optional and a verifier can choose to run a single backend with a single public key too. This redundancy allows for easy participation of decentralized oracle networks like Orbs Network in the protocol (networks that have dozens of independent validators) as a single verifier.

## sources.json

JSON file provided by a specific **verifier** for a specific **contract code hash** containing the URLs of source-code files and verification attestations. Fields of this file include:

* `codeHash` - SHA256 of the code cell CellRepr (https://ton-blockchain.github.io/docs/tvm.pdf 3.1.5), e.g. E/XXoxbG124QU+iKxZtd5loHKjiEUTcdxcW+y7oT9Q4=
* `sources` - Array of sources files, each with the following fields:
    * `url` - Human-readable source-code URL on IPFS and later TON Storage, e.g. [ipfs://QmWQE1HhYuWieFcocfZZvK4gvJqgswNpj3zUCvdPNCC12T](https://tonsource.infura-ipfs.io/ipfs/QmWQE1HhYuWieFcocfZZvK4gvJqgswNpj3zUCvdPNCC12T)
    * `originalFilename` - e.g. "wallet-v3.fc" or "imports/stdlib.fc"
* `compilerType` - Compiler used to compile the verified sources, e.g. "func"
* `compilerVersion` - Version of compiler, e.g. "0.2.0"
* `commandLine` - Command-line used to compile sources, e.g. "func -o output.fif -SPA wallet-v3.fc stdlib.fc"
* `verificationTime` - Unix timestamp of when verification was made

## Verifier registry contract

A smart contract deployed to TON mainnet that holds a mapping between a **verifier id** to the **verifier details** which include the list of backends, their public keys and quorum configuration. To prevent spam in this registry, we propose that each verifier will deposit in the contract a sum of 1,000-10,000 TON coin. This sum will be returned when the verifier unregisters.

#### Actions

* `update_verifier(verifier_id, backend_endpoints, quorum_config)` - If the verifier does not exist, ensures the required amount was deposited and adds to the registry. Otherwise updates details in the registry. The address that sends this update message is stored in the registry as the admin address for this verifier and only it can update. The quorum config contains the list of public keys and how many are needed for quorum.
* `remove_verifier(verifier_id)` - Returns the deposited amount and removes the verifier from the registry. Message can only be sent by the verifier admin.
* `get_verifier(verifier_id)` - Returns details for a given verifier.

Notes: These are high level actions that will be translated to exact message TL-B's and getters later. Potential sharding of this contract to multiple contracts is an implementation detail.

## Sources registry contract

A smart contract deployed to TON mainnet that holds a mapping between a **code hash + verifier id** to the **sources.json url** generated by this verifier.

#### Actions

* `update_sources(code_hash, verifier_id, sources_json_url, signatures)` - Verifies that the signatures match the verifier's quorum detailed under **verifier registry** and updates the **sources registry** with the url.
* `get_sources_json_url(code_hash, verifier_id)` - Returns the sources.json URL for a given code hash and a giver verifier, assuming it exists.

Notes: These are high level actions that will be translated to exact message TL-B's and getters later. Potential sharding of this contract to multiple contracts is an implementation detail. Due to the message nature of TON, the actual verification of the quorum is likely to take place in the **verifier registry** contract which will send a message to the **sources registry** contract to update the entry.

## Verifier backend

A backend server that a verifier runs that exposes HTTP API that receives a list of source files, compiles them and returns a signed proof over the resulting code hash.

#### Actions

* `publish_sources(code_hash, compile_config, sources_data)` - Receives the content of all source files and the compilation command required to compile them, compiles the sources, generates a sources.json and returns its URL.
* `verify_sources(sources_json_url)` - Receives a sources.json URL, downloads the sources described in it, compiles them and verifies that the compilation matches the code hash and if so, signs **code hash + sources_json_url** and returns the signature. 

Notes: These are high level actions that will be translated to REST API or JSON-RPC later.

## Client flows

* Publish new sources - The client selects a specific verifier by its **verifier id**, reads the verifier details from **verifier registry**. Then selects one of the backends from the verifier details and calls **publish_sources()** to publish the sources. Then goes to a quorum of the verifier backends and asks each one to **verify_sources()**. The collected signatures are then sent to **sources registry** via **update_sources()**.

* View sources - The client takes the **code hash** and selects a specific verifier by its **verifier id** and queries **sources registry** with **get_sources_json_url()** to get the sources.

* Manual verification - All users are encouraged to audit a verification proof manually on their own machine. An easy-to-use docker image will be provided that allows any user to takea given **sources.json** and verify it locally by compiling the sources on their own machine. You can see a mock-up of this user flow [here](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_14).

Notes: We expect the protocol to have a few well known verifiers that participate in the protocol. Clients can publish to a single one or to all of them. A verifier can also listen to new publications made by other verifiers and verify them as well. When viewing sources, clients are encouraged to read the verification proofs published by several verifiers and display them side by side - you can see a mock-up for this [here](https://docs.google.com/presentation/d/1lk4W8-7cOxnKJjytRXWXKqIs04MRW7pKZVEuU0Dj8f0/edit#slide=id.g1470cb0de57_0_14). Clients can also focus on specific reputable verifiers that they trust and ignore verifiers that they don't trust (see *source-code displayers* below).

## Source-code displayers

Explorers (see https://ton.app/explorers) will receive an open source JavaScript widget that they can easily embed in their web UI that performs the View Sources process. The widget will be configurable to use the explorer's own fonts and colors. The explorer will be able to specify a white list or black list of verifiers whose proofs are displayed by the widget. When a specific verifier is shown in the community to publish fraudulent proofs, we expect explorers to add it to their black list until community trust is restored. This creates a healthy and natural balance of power between **source-code displayers** (normally explorers) and **verifiers**.

# Drawbacks

The standard is a little cumbersome to implement and will require moderate development effort. The proposers of this standard volunteer to provide an open-source implementation for community review without relying on a grant from TON foundation.

Another potential risk is that the number of verifiers will be small due to insufficient incentive. The proposers of this standard volunteer to make use of an independent oracle network with two dozen independent nodes that will participate as verifiers. This will guarantee that a minimum of verifiers always participates with high redundancy.

# Rationale and alternatives

The leading example of such a service in the Ethereum ecosystem is provided by [Etherscan](https://etherscan.io). The Etherscan service is quite popular and accepted by the community but suffers from several disadvantages due to its very centralized nature:

1. Etherscan is a privately owned company which holds all verified source-code on its private servers. This puts equal access to all source-code in jeopardy.
2. Etherscan do not generally allow to scrape the entire source-code database preventing tools that analyze all sources from being built.
3. The verification service is centralized, allowing Etherscan employees to censor specific contracts or even publish incorrect source-code and falsely represent it as verified, putting users at risk. Since there's a lot of money at stake, there are financial motivations to do so.
4. Third-party explorers cannot compete with Etherscan since they do not have access to the source-code database, creating a monopoly on explorers in the Ethereum ecosystem.

Since contract source-code is such an critical piece of the blockchain participation process, this resource should be regarded as part of the infrastructure and implemented under the similar decentralization standards as the rest of the TON ecosystem. We believe that the Ethereum ecosystem did not provide a decentralized alternative to Etherscan's solution early enough and now it's simply too late to replace there. We should not make a similar mistake in TON.

# Prior art

1. [Etherscan verified source-code example](https://etherscan.io/address/0x1C0C07654E022eB192f7148d37AE171c5C4C44F2#code)
2. [Etherscan UI to upload source-code for contract](https://etherscan.io/verifyContract)
3. [TONSC.org Source code verifier](https://verifier.tonsc.org/)

# Unresolved questions

* Define specific interfaces after general acceptance.

* Discuss incentive mechanism for verifiers, possibly paying a verifier a small TON amount when publishing the source-code for a new code hash. Alternatively the foundation can help fund a pool of TON coin that will be issued to active verifiers.

# Future possibilities

TBD
