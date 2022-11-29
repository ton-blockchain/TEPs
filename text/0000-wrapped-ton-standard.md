- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) _(don't change)_
- **title**: Wrapped TON standard
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Nick Nekilov](https://github.com/NickNekilov), [Mark Okhman](https://github.com/markokhman), [Dan Volkov](https://github.com/dvlkv)
- **created**: 15.12.2022
- **replaces**: -
- **replaced by**: -

# Summary

1. The common deployed implementation of contract that performs wrapping and unwrapping TON on-demand.

- **Source code:** https://github.com/NickNekilov/wton-contract
- **Contract address:** [TO BE DEPLOYED]

2. Standard that is defining interfaces for interaction with this deployed implementation.

# Motivation

Interaction with different kinds of assets requires additional conditional logic. To avoid that and unify interaction between TON and jettons of TEP-74 and TEP-89 standards, we introduce a jetton that is locking TON 1-to-1 on mint and releases TON on burn. We call it wrapped TON - WTON.

Implementation of a wrapped TON contract doesnt require a lot of effort. As a matter of fact, several implementations already exist. The problem is that numerous different wrapped TONs (wTON, jTON etc) created by different developers bare lots of risks:

- **Financial risks:** there is no guarantee that a particular WTON doesn't hold security vulnerabilities left deliberately or by mistake. Getting security audits and certifications of the same quality for all the many WTONs is unrealistic.
- **Ecosystem fragmentation and no single API:** this is a real problem for developers who are building products that will have to use a variety of WTONs. Imagine a wallet developer who wants to correctly display the total amount of WTON, including regular and all kinds of wrapped ones.
- **No parity of features:** each WTON will have its own unique set of features, which will lead to additional issues with support.

# Guide

Despite the specification of usecase, one using WTON should be aware of how **wrapping** and **unwrapping** of TON generally works in our deployed implementation.

### Wrapping

After receiving a mint operation code with a message, WTON minter reserves `amount + minimal_balance()` TON on the minter contract and sends the rest to a WTON wallet of `recipient` within `internal_transfer` message.

One of the most important things is the ability to attach `forward_amount` and `forward_payload` to build a pipeline of transactions.

The message should be rejected if:

- `msg_value` is less than `amount + forward_amount + gas_fee`
- `recipient` is in different workchain than the minter

### Unwrapping

In order to unwrap WTON jettons back to TON, `burn` operation code should be used.

Our deployed implementation relies on existing operation `burn` (including `custom_payload`) but uses a new operation `burn_notification_ext` instead of `burn_notification`.
The only reason of replacing `burn_notification` by a new `burn_notification_ext` is inability to attach a `custom_payload`.

After burning, a jetton wallet sends `burn_notification_ext` to a minter. As soon as WTON minter receives `burn_notification_ext` message, it decreases `total_supply` by `amount`,
reserves `total_supply + minimal_balance()` and sends a message with `release` operation code to `response_destination` attaching the rest of TON and optional `custom_payload`.

The message with `burn` operation should be rejected if:

- `response_destination` is not specified
- `amount` is less than jetton balance of jetton wallet
- `msg_sender` is not an owner of jetton wallet
- `msg_value` is not enough for handling both messages `burn` and `burn_notification_ext`

# Specification

The standart deployed WTON implementation is fully compatible with [TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) and [TEP-89](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md) standards.

Specific operations inroduced in this implementation:

```tl-b
burn_notification_ext#84106950 query_id:uint64 amount:Coins
                           sender:MsgAddress response_destination:MsgAddress
                           custom_payload:(Maybe ^Cell) = InternalMsgBody;

mint#864e0716 query_id:uint64 amount:Coins recipient:MsgAddress forward_amount:Coins
              forward_payload:(Maybe ^Cell) return_excesses_to:MsgAddress = InternalMsgBody;

release#71c6af6b query_id:uint64 custom_payload:(Maybe ^Cell) = InternalMsgBody;
```

# Drawbacks

The implemented solution is quite straight forward from the technical perspective because it is based on the commonly accepted standards of jettons ([TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) and [TEP-89](https://github.com/ton-blockchain/TEPs/blob/master/text/0089-jetton-wallet-discovery.md)).
This is a serious optimisation of work for the developers who build products with TON to jetton trades usecases. However, there are some drawbacks from the perspective of the end users:

1. A trade of TON to any jetton and vise versa with use of WTON ends up as a longer chain of transactions, thus becoming more expensive and less friendly for tracking.
2. A non-educated end user might be seriously confused once he receives WTONs. This might be a crutial point for the mass addoption.

# Rationale and alternatives

As discussed above, our approach has a very strong advantage of enabling a pipeline of transactions on minting (wrapping) and burning (unwrapping). This is important, because the developers of products could take the best of having a wrapped TON (saving time on writing different smartcontract on each TON/jetton pair), while not confusing the end user with WTON unless it is really needed.

**Classic example with a decentralized exchange (DEX):** When user wants to trade TON to some jetton, he will send TONs to the WTON minter and the WTON will be minted directly to the DEX's WTON wallet along with `forward_amount` and `forward_payload` that would contain the end-users wallet address. This way DEX will know whom to send jettons and will have enough funds to complete this internal transfer of jettons.

Our solution is also rewerse compatible - so anybody who wants to wrap their TON and trade directly WTON to jettons to slightly reduce the transactions cost can do this with accordance to TEP-74/TEP-89 jetton standard.

We've discussed other 2 ways to implement the minting process of WTON:

1. **Using the TEP-74/TEP-89 jetton standard with no changes**
   We didn't go with this approach, because this would require the end user to encounter the WTON, which we wanted to avoid to reduce confusion of the non-educated end users. In order to avoid this UX gap, developers would need to have an additional contract for wrapping / unwrapping coins. This approach works (ex. DeDust DEX is using it), but causes additional commission costs and is less reliable due to more inter-contract interactions.
2. **Minting WTON to the mint requester's wallet and implicitly trigger a transfer to the DEX's WTON wallet** suggested by [Dario](github.com/dariotarantini), developer at ston.fi exchange.
   This approach would avoid introducing extra operation codes, because the jetton wallet sends a message to self from a payload, received from the initial mint process. In this way mint and transfer would happen atomically without introducing new logics. The results are quite similar - pipeline of transactions, however, this would require one extra transaction and also the end user would end up seeing transactions on his WTON wallet that he didn't explicitly confirm thus would be confused.

# Prior art

We can reference to a similar problem and solution approach on Ethereum blockchain. The interface for transacting with Ethereum’s native asset, ETH, is different from the standard interface for interacting with ERC-20 tokens. As a result, many protocols on Ethereum do not support ETH, instead using a canonical ”wrapped ETH” token, WETH.

Let's look at the example of the one of the most popular Ethereum exchange protocol - Uniswap.

Uniswap v1 used ETH as a bridge currency. Every pair included ETH as one of its assets. This makes routing simpler—every trade between ABC and XYZ goes through the ETH/ABC pair and the ETH/XYZ pair—and reduces fragmentation of liquidity. However, this rule imposes significant costs on liquidity providers. Using ETH asо a mandatory bridge currency also imposes costs on traders. Traders have to pay twice as much in fees as they would on a direct ABC/XYZ pair, and they suffer slippage twice.

Uniswap v2 excluded support of unwrapped ETH, which enabled it to support any arbitrary ERC-20 pairs. The native ETH needs to be wrapped into WETH before it can be traded on Uniswap v2.

You can get more details on WETH usage in Uniswap [in their whitepaper](https://uniswap.org/whitepaper.pdf).

# Unresolved questions

None

# Future possibilities

None
