- **TEP**: [115](https://github.com/ton-blockchain/TEPs/blob/master/text/0115-ton-connect.md)
- **title**: TON Connect
- **status**: Active
- **type**: Core
- **authors**: @oleganza, @siandreev, subden, brainpicture, @sorokin0andrey, abogoslavskiy, @MariaBit, Olga May, Aleksei Mazelyuk, tonrostislav, KuznetsovNikita.
- **created**: 20.10.2022
- **replaces**: -
- **replaced by**: -

# Summary

TON Connect is a unified protocol for communication between TON wallets and TON apps.

# Motivation

The Open Network needs a **unified** protocol for communication between TON wallets and TON (d)apps to achieve following goals:

1. Any TON app (web / desktop / mobile / etc) can be operated by any wallet (mobile / desktop / web / browser extension / dapp browser / hardware / etc).


2. Users get a familiar and friendly experience across all TON apps.

# Guide

Apps provide the UI to an infinite range of functionality in TON based on smart contracts, but do not have immediate access to users’ funds. Therefore they are often called decentralized apps or “dapps”.

Wallets provide the UI to approving transactions and hold users’ cryptographic keys securely on their personal devices.

This separation of concerns enables rapid innovation and high level of security for the users: wallets do not need to build walled-garden ecosystems themselves, while the apps do not need to take the risk holding end users’ accounts.

TON Connect is a bridge that crosses this conceptual gap.

TON Connect, in addition to the transport layer of communication between the wallet and the app, provides methods of authorization, sending transactions to the network, interaction with smart contracts, etc.

# Specification

Docs and specs are in [https://github.com/ton-blockchain/ton-connect](https://github.com/ton-blockchain/ton-connect) repo.

At the time this PR was created (27 Feb, 2023) the revision was `acc5dd4d2106891cbfcade8d7faa58b9e16937fd`.

# Rationale and alternatives

## Unified way

Since we strive to make blockchain as convenient and user-friendly as possible, communication between any app and any wallet (mobile wallet or browser extension or something else) must work in a unified way.

This is convenient not only for users, but also for the developers of wallets and developers of dapps, which will need to support only one protocol.

Examples of other blockchains (e.g., Ethereum) that have failed to achieve a single network-wide standard show that this confuses users and makes it difficult for developers: both must understand the different types of wallets and connections.

## Sessions for rich dapps

The simplest "one-action" interaction between wallet and dapp can be done with a simple ton:// deeplink, in this variant in general it is not possible to get a response to the request or events in the runtime.

Since rich features are required for more sophisticated dapps, the TON Connect allows to establish permanent connections between the wallet and the application, get responses and events.

## SSE

TON Connect uses SSE ([Server-Sent Events](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)) protocol instead of websockets, because with websockets in practice there are many connectivity problems that do not have a guaranteed solution.

## Backend side

Interaction between wallet and dapp without a backend is possible only for dapp browser or browser extensions with a locally open dapp. 

If dapp and wallet are opened on different devices (for example the user opened app on desktop and wallet on mobile) an intermediary is needed for communication (relay or bridge).

Given the previous point about a unified protocol for all types of wallets in the general we need a backend intermediary in TON Connect.

TON Connect uses a simplest bridge for this. 

All messages that pass through bridge are encrypted with end-to-end encryption, which preserves the privacy of users.

Dapp browsers and browser extensions can use the JS bridge without the need to run a backend server, while the protocol remains consistent for all types of wallets.

## Common public bridge

TON Connect allows to run public bridge(s), which can use any wallets and dapps.

This option is suitable for quick implementation of TON Connect, but has several drawbacks: the public bridge can potentially get the IP addresses of wallet users, some wallets may want extra functionality of the bridge.

## Wallets can run and host own bridge

TON Connect allows wallets to run their own bridge if they don't want to use a public bridge.

Each wallet can maintain their own bridge server and are free to choose how to communicate with it.

## Dapps don't need to run bridge

In Ton Connect apps do not need to maintain their own backend to receive data from the wallets.

We believe that wallet developers have more possibilities for permanently hosting servers than dapp developers: many dapps are simple serverless web pages. Another argument is that there are many more dapps than wallets.

## Open, Free, Decentralized

The unified network-wide standard should be open-source and free.

It is important that it be decentralized, not to depend on a particular server, company or implementation.

As an example, any wallet or dapp should be able to work with this technology without someone else's centralized permission.

TON Connect satisfies these considerations.

We can give an example of the opposite concept of WalletConnect, where all wallets and apps must communicate through a single relay belonging to a particular organization. The possibility of running your own relay (bridge) in WalletConnect is in the plans.

## Wallet list

For the convenience of developers it makes sense to create a single config with a list of all the wallets and their info (eg, the bridge address).

Also, for the convenience of the user, UI can display wallets from this list, if the user does not yet have a wallet installed.

Such a list is located in the repository [https://github.com/ton-blockchain/wallets-list](https://github.com/ton-blockchain/wallets-list).

The rules for getting on this list should be simple - the correct technical implementation of TON Connect.

We note that the protocol itself does not depend on this list.

Despite some point of centralization and possible self-regulation issues, such a list would also contribute to the cross-linking and uniformity of the ecosystem.

# Future possibilities

Further development of TON Connect is expected in the addition of new RPC methods covering various functionalities.
