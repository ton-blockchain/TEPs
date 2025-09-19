- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Tokenized Vaults
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Maxim Gromov](https://github.com/krigga), [Mansur Korigov](https://github.com/SlorrUndef)
- **created**: 19.09.2025
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for Tokenized Vaults that represent shares of one or many underlying assets (which can be the native currency, extra currencies, or jettons).

# Motivation

There are presently multiple DeFi protocols on TON which use smart contracts that are in essence Tokenized Vaults, however since there is not a single standard, they are implemented differently, which may introduce integration friction for consumers.

# Guide

TBD

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

This TEP is an extension of [TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md). Each Tokenized Vault is an instance of TEP-74, and the tokens of the instance represent the shares of the vault. Other than that, each Tokenized Vault also has an underlying asset, which may be native currency, extra currency, or another Jetton (instance of TEP-74).

## Tokenized Vault

A Tokenized Vault is an extended Jetton master contract, with the following extensions of TEP-74 defined methods:

1. `get_jetton_data()` returns `(int total_supply, int mintable, slice admin_address, cell jetton_content, cell jetton_wallet_code)`

   `total_supply` - (integer) - the total number of issued shares
   
   `mintable` - (-1/0) - flag which indicates whether the number of shares can increase
   
   `admin_address` - (MsgAddressInt) - address of smart contract which controls the Tokenized Vault
   
   `jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md), which SHOULD reflect the underlying asset's content (name and symbol) in some way. It need not have the same `decimals` as the underlying asset
   
   `jetton_wallet_code` - cell - code of share wallet for this Tokenized Vault
2. `get_wallet_address(slice owner_address)` returns `slice jetton_wallet_address`
   Returns share wallet address (MsgAddressInt) for this owner address (MsgAddressInt).

Other than the methods defined by TEP-74, each Tokenized Vault MUST implement the logic outlined below.

### Deposit

Let us define a deposit request TL-B structure:
```tlb
deposit_request$0 min_shares:Coins receiver:MsgAddressInt refund_to:MsgAddressInt custom_payload:(Maybe ^Cell) forward_payload:(Maybe ^Cell) = DepositRequest;
mint_request$1 shares:Coins receiver:MsgAddressInt refund_to:MsgAddressInt custom_payload:(Maybe ^Cell) forward_payload:(Maybe ^Cell) = DepositRequest;
```

The `deposit_request` has the following meaning - spend all of the provided underlying assets; refund if not enough assets to send at least `min_shares` shares to receiver

The `mint_request` has the following meaning - send exactly `shares` shares to receiver; refund everything if not enough provided assets to cover `shares` shares; refund remaining underlying assets on success.

`receiver` - the address of the receiver of the shares.

`refund_to` - the address to which the remaining underlying assets will be refunded if the request is not successful, or if there are leftover underlying assets after the request is successful. If `refund_to` is an `addr_none`, the remaining underlying assets will be refunded to `receiver`.

`custom_payload` - an optional custom payload to be included in the deposit request; it is intended to be used for standard extensions.

`forward_payload` - an optional forward payload to be included in the deposit request; it will be forwarded to the receiver of the shares as is; it is intended to be used for users' information passing purposes.

A Tokenized Vault may receive deposit requests in different ways depending on the type of the underlying assets. When the underlying asset is a native currency or an extra currency, the Tokenized Vault MUST implement the following internal message handlers (TL-B schema of incoming message):
```tlb
deposit_message_ton#5d16e2a3 query_id:uint64 coins:Coins deposit_request:DepositRequest = InternalMsgBody;
```
(for TON deposit/mint)

or
```tlb
deposit_message_extra_currency#1ff2d66b query_id:uint64 deposit_request:DepositRequest = InternalMsgBody;
```
(for extra currency deposit/mint)

`coins` (for TON) - the amount of TON to deposit. The message is refunded if the message does not have enough TON to cover both `coins` and blockchain fees.

For extra currency deposits, the attached extra currency amount is used as the deposit amount. Only 1 extra currency may be attached. Otherwise, the message is refunded.

`query_id` - arbitrary request number.

When the underlying asset is a Jetton (instance of TEP-74), the Tokenized Vault MUST implement the following handler of `transfer_notification#7362d09c` (described in TEP-74):
If the `forward_payload` of the transfer notification begins with the bits `c0ffeeee`, then it must be parsed according to the following TL-B schema and processed as a deposit request:
```tlb
deposit_notification#e2e1f51b deposit_request:DepositRequest = TransferNotificationBody;
```

**Should be refunded if:**

1. (If the underlying asset is native currency) The request does not have enough TON attached to cover both `coins` and blockchain fees, or native currency is not an underlying asset
2. (If the underlying asset is an extra currency) The request does not contain an underlying asset extra currency, or there is more than 1 extra currency attached
3. (If the underlying asset is a jetton) The request does not originate from a jetton wallet address that represents an underlying asset
4. (For deposit requests) Not enough assets were attached to cover `min_shares`
5. (For deposit requests) `min_shares` is 0
6. (For mint requests) Not enough assets were attached to cover `shares`
7. `receiver` is `addr_none`
8. Tokenized Vault's internal conditions are not met (e.g. depositing is paused, or a depositing limit has been reached)

The refund is sent to `refund_to` address (if not `addr_none`), or to the `receiver` address (if `refund_to` is `addr_none`). For native currency and extra currency underlying assets, the refund is sent as a message with the following TL-B schema:
```tlb
refund_message#de4439ad query_id:uint64 forward_payload:(Maybe ^Cell) = InternalMsgBody;
```

with all of the remaining underlying assets, as well as remaining (unused for blockchain fees) native currency attached. `query_id` MUST be the same as in the deposit request.

For jetton underlying assets, the refund is sent as a jetton transfer, with all of the remaining (unused for blockchain fees) native currency attached. `query_id` MUST be the same as in the deposit request. Forward payload of the transfer is according to the following TL-B schema:
```tlb
refund_notification#fbaa0041 forward_payload:(Maybe ^Cell) = TransferNotificationBody;
```

**Otherwise should do:**

1. Perform the necessary accounting with the newly acquired underlying assets
2. Mint the determined number of shares to the receiver's share wallet; the forward payload of the minting jetton transfer MUST be in accordance to the following TL-B schema:
```tlb
mint_payload#f98c9a68 used_assets:Coins refunded_assets:Coins forward_payload:(Maybe ^Cell) = JettonTransferPayload;
```

`used_assets` - the amount of underlying assets that were used to mint the shares.

`refunded_assets` - the amount of underlying assets that were refunded.

3. Send any remaining underlying assets, as well as remaining (unused for blockchain fees) native currency, to the `refund_to` address (if not `addr_none`), or to the `receiver` address (if `refund_to` is `addr_none`)

### Onchain-Getters
Let us define a preview request TL-B structure:
```tlb
preview_request#97e348c0 query_id:uint64 mode:uint2 asset:(Maybe UnderlyingAsset) argument:Coins forward_payload:(Maybe ^Cell)  = InternalMsgBody;
```

The `preview_request` has the following meaning - onchaing getter request for all preview operations.

`query_id` - arbitrary request number.

`mode` - preview mode: deposit(0), mint(1), withdraw(2), redeem(3).

`asset` - `UnderlyingAsset` asset identifier. Can be set to `none` for single asset vaults.

`argument` - amount of `UnderlyingAsset` or amount of shares. 

`forward_payload` - an optional forward payload to be included in the preview request; it will be forwarded to the receiver of the preview result; it is intended to be used for users' information passing purposes.

Tokenized Vault MUST implement the following internal message handlers (TL-B schema of outgoing message):
```tlb
preview_response#ca7b371f query_id:uint64 mode:uint2 asset:(Maybe UnderlyingAsset) argument:Coins result:Coins forward_payload:(Maybe ^Cell) = InternalMsgBody;
```

The `preview_request` has the following meaning  - onchaing getter response for all preview operations.

`query_id` - arbitrary request number.

`mode` - preview mode: deposit(0), mint(1), withdraw(2), redeem(3).

`asset` - `UnderlyingAsset` asset identifier. Can be set to `none` for single asset vaults.

`argument` - amount of `UnderlyingAsset` or amount of shares. 

`result` - result of calculation.

`forward_payload` - an optional forward payload to be included in the preview request; it will be forwarded to the receiver of the preview result; it is intended to be used for users' information passing purposes.


### Get-methods

1. `get_asset_info()` returns `tuple assets`

   `assets` - (tuple) - tuple of tuples containing information about assets. Each element of the `assets` tuple is a tuple of the form `[slice asset, int balance]` where `asset` is an `UnderlyingAsset` TL-B structure (outlined below), and `balance` is the balance of that asset of the vault.
```tlb
native_currency$00 = UnderlyingAsset;
extra_currency$01 extra_currency_id:uint64 = UnderlyingAsset;
jetton$10 jetton_master_address:MsgAddressInt = UnderlyingAsset;
```

2. `convert_to_shares(slice asset, int assets)` returns `int shares`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `assets` - (integer) - the number of underlying assets to be converted to shares.
   
   `shares` - (integer) - the number of shares that will be received for the given number of underlying assets.
   
   Both `assets` and `shares` are before fees. `shares` should be rounded down.
3. `convert_to_assets(slice asset, int shares)` returns `int assets`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `shares` - (integer) - the number of shares to be converted to underlying assets.

   `assets` - (integer) - the number of underlying assets that will be received for the given number of shares.

   Both `assets` and `shares` are before fees. `assets` should be rounded down.

4. `preview_deposit(slice asset, int assets)` returns `int shares`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `assets` - (integer) - the number of underlying assets to be deposited.

   `shares` - (integer) - the exact number of shares that would be minted for the given deposit amount, including all fees.

5. `preview_mint(slice asset, int shares)` returns `int assets`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `shares` - (integer) - the number of shares to be minted.

   `assets` - (integer) - the exact number of underlying assets that would be required to mint the given shares, including all fees.

6. `preview_withdraw(slice asset, int assets)` returns `int shares`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `assets` - (integer) - the number of underlying assets to be withdrawn.

   `shares` - (integer) - the exact number of shares that would be burned for the given withdrawal amount, including all fees.

7. `preview_redeem(slice asset, int shares)` returns `int assets`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `shares` - (integer) - the number of shares to be redeemed.

   `assets` - (integer) - the exact number of underlying assets that would be returned for redeeming the given shares, including all fees.

8. `max_deposit(slice asset)` returns `int max_assets`

   `asset` - (slice) - `UnderlyingAsset` asset identifier

   `max_assets` - (integer) - the maximum amount of underlying assets that can be deposited. Returns 0 if deposits are not possible.


9. `max_withdraw(slice asset)` returns `int max_assets`

    `asset` - (slice) - `UnderlyingAsset` asset identifier

    `max_assets` - (integer) - the maximum amount of underlying assets that can be withdrawn. Returns 0 if withdrawals are not possible.


## Share Wallet

A Share Wallet is a Jetton wallet contract, with the following extensions of TEP-74 defined methods:

1. `transfer` internal message handler - may be rejected if the Tokenized Vault's shares cannot be transferred (as determined by the Tokenized Vault's logic)
2. `burn` internal message handler - is used for withdraw/redeem when `custom_payload` is serialized as outlined below
2. `get_wallet_data()` returns `(int balance, slice owner, slice jetton, cell jetton_wallet_code)`

   `balance` - (uint256) amount of shares belonging to `owner`;
   
   `owner` - (MsgAddress) address of wallet owner;
   
   `jetton` - (MsgAddress) address of the Tokenized Vault;
   
   `jetton_wallet_code` - (cell) code of the Share Wallet.

Other than the methods defined by TEP-74, each Share Wallet MUST implement the logic outlined below.

### Withdraw

A Share Wallet MUST accept the followint `custom_payload` formats in the `burn#595f07bc` internal message handler (described in TEP-74) for withdraw and redeem flows:
```tlb
withdraw_request$0 asset:(Maybe UnderlyingAsset) assets:Coins receiver:MsgAddressInt refund_to:MsgAddressInt custom_payload:(Maybe ^Cell) forward_payload:(Maybe ^Cell) = WithdrawRequest;
redeem_request$1 asset:(Maybe UnderlyingAsset) min_assets:Coins receiver:MsgAddressInt refund_to:MsgAddressInt custom_payload:(Maybe ^Cell) forward_payload:(Maybe ^Cell) = WithdrawRequest;
```

The `amount` field of the `burn` message has the following meaning:
1. For `withdraw_request` - `amount` will be burned immediately; once the vault processes the request, some shares may be minted back after exactly `assets` are withdrawn (effectively, `amount` == `max_shares` that will be burned); OR if the withdrawal fails, the whole `amount` will be minted back
2. For `redeem_request` - `amount` will be burned immediately; the vault will redeem at least `min_assets` (effectively, `amount` == `shares` that will be burned); OR if the redeem fails, the whole `amount` will be minted back
3. If `amount` is 0, the share wallet balance will be used instead

`asset` - `UnderlyingAsset` asset identifier. Can be set to `none` for single asset vaults.

`receiver` - the address of the recipient of wihdrawn/redeemed underlying assets.

`refund_to` - the address to which all refunds happen (all share tokens for failed requests, leftover shares for `withdraw_requests`).

`custom_payload` - an optional custom payload to be included in the withdraw/redeem request; it is intended to be used for standard extensions.

`forward_payload` - an optional forward payload to be included in the withdraw/redeem request; it will be forwarded to the receiver of the underlying assets as is; it is intended to be used for users' information passing purposes.

**Should be refunded if:**

1. (For withdraw requests) `max_shares` is not enough to cover `assets` amount of underlying assets, as well as Tokenized Vault's fees
2. (For redeem requests) `shares` is not enough to cover `min_assets` amount of underlying assets, as well as Tokenized Vault's fees
3. `receiver` is `addr_none`
4. Tokenized Vault's internal conditions are not met (e.g. redeeming is paused, or a redeeming limit has been reached)
5. `asset` is `none` for multi asset vault, or the `asset` is not found in the vault

**Otherwise should do:**

1. Burn the determined number of shares from the Share Wallet
2. Send the determined amount of underlying assets to the `receiver` address

If successful, the Tokenized Vault MUST send a `withdrawn` message to the `receiver` either as a message (for TON and extra currency underlying assets):
```tlb
withdrawn_ton#46109ea1 query_id:uint64 withdrawn:Coins used_shares:Coins refunded_shares:Coins forward_payload:(Maybe ^Cell) = JettonTransferPayload;

withdrawn_extra_currency#1c8dc2c6 query_id:uint64 used_shares:Coins refunded_shares:Coins forward_payload:(Maybe ^Cell) = JettonTransferPayload;
```

or as a jetton transfer forward payload:
```tlb
withdrawn_jetton#73253c6c used_shares:Coins refunded_shares:Coins forward_payload:(Maybe ^Cell) = JettonTransferPayload;
```

Share refunds are sent as jetton transfer forward payload to `refund_to` address (or to `receiver` address if `refund_to` is `addr_none`):
```tlb
shares_refunded#cc5c9b6b forward_payload:(Maybe ^Cell) = JettonTransferPayload;
```

# Drawbacks

TBD

# Rationale and alternatives

## Aligning with EIP-4626
    Instead of totalAssets we have get_asset_info which returns a tuple (array) of assets alongside their balances.
## Why not split TEP into 3 different standards (single-asset vault, native-asset vault, multi-asset vault)?
    We believe we have a few reasons to not split this standard into multiple standards, as on EVM:

    There is not a standardized and/or widely used "wrapped TON" like WETH on Ethereum - using TON where jettons are expected is not as straightforward. Existing DeFi projects either roll their own transparent wTON or just support native TON as is, as this standard attempts to do.
    Unlike EVM where the standards seem to have evolved over time (7575 was created 2 years after 4626), here we can include all of the features that seem to be required by someone (after all, there is a reason these standards appeared on EVM) immediately and not have to worry about compatibility later.
    It doesn't seem to us that removing TON and extra currency support would simplify the API all that much.


# Prior art

[EIP-4626](https://eips.ethereum.org/EIPS/eip-4626)
[EIP-7575](https://eips.ethereum.org/EIPS/eip-7575)

# Unresolved questions

TBD

# Future possibilities

TBD

# Acknowledgements
We are grateful to the [Ethena Labs](https://github.com/ethena-labs), [Aave Labs](https://github.com/aave) developers for collaborating on the current draft of the standard 🤝
