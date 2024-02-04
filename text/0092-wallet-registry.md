- **TEP**: [92](https://github.com/ton-blockchain/TEPs/pull/92)
- **title**: Wallet Registry
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Tal Kol](https://github.com/talkol)
- **created**: 11.09.2022
- **replaces**: -
- **replaced by**: -

# Summary

This standard defines an on-chain registry to hold a list of wallet providers (such as [TonKeeper](https://tonkeeper.com/) and [TonHub](https://tonhub.com/)) and allows TON dapp clients to query this list before displaying the "Connect Wallet" screen.

# Motivation

TON app developers, for example those developing a DEX like [Ston.fi](https://ston.fi/) or [TonSwap](https://github.com/tonswap/) or an NFT marketplace like [GetGems](https://github.com/getgems-io) or [Disintar](https://github.com/disintar), normally create a client that allows TON end-users to interact with their app and its smart contracts.

The first screen that is normally displayed to users in this client is the "Connect Wallet" screen. By connecting to their wallet, users normally share their TON wallet address with the app and allow the app to request approvals for sending transactions on behalf of the user.

Different wallets in the TON ecosystem support different connection methods - including [TonConnect](https://github.com/tonkeeper/ton-connect), [ton-x](https://github.com/ton-foundation/ton-x), [JS API similar to MetaMask](https://github.com/toncenter/dapp-example) and API for interacting with Telegram-bot based wallets like [@wallet](https://t.me/wallet). According to the connection protocol, each wallet provider normally advertises public connection endpoints such as backend servers or deeplinks / universal links.

The goal of this standard is to allow app clients to query an up-to-date on-chain list of available wallets for populating this "Connect Wallet" screen, instead of performing a 1:1 integration with every wallet provider.

If we look in the Ethereum ecosystem, we see that no such registry exists and dapp developers are forced to do a 1:1 integration with each wallet provider. This approach has serious disadvantages that impact the Ethereum ecosystem negatively to this day:

* It is almost impossible for new wallet providers to compete over dapp end-users, because supporting them would require all existing dapps (like [Aave](https://aave.com/) and [Uniswap](https://app.uniswap.org/)) to redeploy their clients and add the new wallet to the supported list. Since most of these new wallets don't have yet a criticial mass of end-users, there is weak incentive for dapps to go out of their way to add them.

* The above reason has created a monopoly over dapp-supporting wallets where effectively 90% of dapp end-users only use [MetaMask](https://metamask.io/). Since wallets by definition are a centralized entity, this created a centralized choke-point in an ecosystem that is supposed to be decentralized. Ultra rich exchanges like [Coinbase](https://www.coinbase.com/wallet) are the only ones who can compete with MetaMask today.

* There is no way for wallet providers to rebrand or change their public connection endpoints (like deeplinks) without breaking existing dapps. Coinbase Wallet is actually the [acquired](https://brd.com/brd-joins-coinbase) BRD wallet team with rebranding due to the acquisition. Some dapps even show old wallets in the connect list which no longer exist.

* It is very difficult to deprecate connection APIs gracefully without breaking users with no explanation. MetaMask tried to break its web3 API and that was particularly painful for users.

# Guide

## Wallet registry contract

The standard stores the list of wallet providers available to dapps in a registry contract deployed to TON mainnet. The registry simply holds a list of TON DNS names for participating wallets. Each participating wallet provider is required to advertise its public connection details (according to the connection protocols it supports) as TON DNS records. The flow for a new wallet provider is as follows:

1. Register a unique TON DNS name (eg. `tonkeeper.ton` or `tonhub.ton`).
2. Advertise connection details as TON DNS records under this name as well as name, description and logo.
3. Register the TON DNS name in the well-known wallet registry contract.

### Discussion: alternative storage formats instead of TON DNS

We realize that relying on TON DNS records for storing connection details, name and logo is an expansion of the [intended use](https://github.com/ton-blockchain/TEPs/blob/master/text/0081-dns-standard.md#dns-records) of TON DNS. If the community dislikes the expansion, alternative suggestions for discussion include:

1. Storing the records on-chain as part of **wallet registry contract** storage, in an attribute dictionary per wallet provider similar to how [on-chain token metadata](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#content-representation) is stored.

2. Storing the records off-chain as a JSON document on a URL hosted by each wallet provider, the **wallet registry contract** in this case will store the list of URLs.

## App client flow

Since this proposal is aiming to make it easier for app developers to build their clients, the flow from the dapp client point of view:

1. We assume the dapp client is able to query data from the chain (this part is out of scope of this proposal and can rely on [toncenter](https://toncenter.com/api/v2/), directly on [ADNL via proxy](https://github.com/tonstack/wsadnlroxy) or any other way).
2. Query the well-known wallet registry contract and get the list of TON DNS names for available wallet providers.
3. Query the TON DNS records for each of these wallet providers to get each wallet's connection details, name, description and logo.
4. Display the wallet provider list for the user as part of the "Connect Wallet" screen.
5. The end-user chooses the wallet from the list that they're using, and if they don't have a supported wallet, can see an up-to-date list of wallets that they can download in order to use the app.

Once the standard is approved, JavaScript client libraries that perform the above steps will be published in order to make integration into dapp clients as easy as possible.

# Specification

## Wallet registry contract

The contract holds a list of TON DNS names of wallet providers in its persistent storage. Anyone can add a new TON DNS name to the list. To reduce spam, we propose to require a deposit of 1,000-10,0000 TON Coin for registration that will be held by the contract and returned if the wallet provider unregisters.

#### Actions:

* `register_wallet(dns_name)` - Lets a new wallet provider register its TON DNS name, makes sure the deposit was paid.
* `unregister_wallet(dns_name)` - Lets an existing wallet provider unregister its TON DNS name, returns the deposit.
* `get_wallets(iterator)` - Getter to query the current list of registered wallets.

Notes: The actions are defined in a high level format, detailed TL-B will be discussed in a later stage. An efficient way to store the list warrants some discussion, we can use a dictionary and return a [tuple](https://github.com/newton-blockchain/ton/blob/b38d227a469666d83ac535ad2eea80cb49d911b8/crypto/smartcont/elector-code.fc#L1125), or use a linked list. Another interesting idea is to allow variable deposits and sort the list by descending deposit order so on spam, reading just the first dozen entires would yield high quality results.

## Records stored per wallet

Every wallet provider can advertise public connection details via TON DNS records. The following types of attributes are supported:

* `name` - UTF8 string. The name of the wallet, e.g. "TonKeeper"
* `description` - Optional. UTF8 string. Describes the wallet in a few words, e.g. "Your mobile wallet on The Open Network"
* `image` - ASCII string. A URL pointing to a resource with mime type image showing the wallet logo, e.g. https://api.ton.app/uploads/ic_launcher_4cbb4e2f1a.svg 
* `download_url` - ASCII string. A URL pointing to a page where the wallet can be downloaded from, e.g. https://tonkeeper.com/download
* `platforms` - Optional. ASCII string. Indicates that the wallet is only supported on specific platforms, comma-separated string with the following options `mobile,ios,android,desktop,windows,macos,linux,chrome,firefox,safari,edge`
* `tonconnect_v1_server` - Optional, used if wallet supports [TonConnect v1](https://github.com/tonkeeper/ton-connect). ASCII string. URL for server supporting TonConnect protocol, e.g. https://tonapi.io/v1/connect
* `tonconnect_v1_deeplink` - Optional, used if wallet supports [TonConnect v1](https://github.com/tonkeeper/ton-connect). ASCII string. Mobile deeplink / universal link for the wallet supporting TonConnect scheme, e.g. https://app.tonkeeper.com
* `tonx_v1_server` - Optional, used if wallet supports [ton-x](https://github.com/ton-foundation/ton-x). ASCII string. URL for server supporting ton-x protocol, e.g. https://connect.tonhubapi.com
* `tonx_v1_deeplink` - Optional, used if wallet supports [ton-x](https://github.com/ton-foundation/ton-x). ASCII string. Mobile deeplink / universal link for the wallet supporting ton-x scheme, e.g. https://app.tonhub.com

Notes: The developers of additional connection protocols (beyond TonConnect and ton-x) are expected to add their required attributes to the list above. We also plan to review the attributes for TonConnect and ton-x with their respective developers and improve both protocols to more easily support alternative wallets beyond TonKeeper and TonHub.

# Drawbacks

None

# Rationale and alternatives

The main rationale behind this proposal is allowing TON dapp developers to automatically support an always up-to-date list of wallets without requiring them to rebuild and redeploy their dapp clients whenever a new wallet is launched or any of the existing wallets' connection details change.

This proposal will hopefully prevent TON from going in the Ethereum route of the MetaMask wallet monopoly for dapps and will encourage a more healthy and decentralized ecosystem of participating wallets that will all be widely supported by all dapps.

An alternative implementation can be designed without storing the wallet provider registry on-chain in a smart contract. The list of providers can be hosted in a TON foundation GitHub repository similar to [global.config.json](https://github.com/ton-blockchain/ton-blockchain.github.io/blob/main/global.config.json) as a JSON document. The benefit and drawback of this approach is increased centralization and control of the wallet list by the TON core team. The GitHub approach is more prone to hacks and downtime but is more easily accessible without TON blockchain gateways like toncenter.com.

# Prior art

None

# Unresolved questions

TBD

# Future possibilities

TBD
