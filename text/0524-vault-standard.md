- **TEP**: [524](https://github.com/ton-blockchain/TEPs/pull/524)
- **title**: Tokenized Vaults Standard for TON Blockchain
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Torch Finance - Maxey Liu](https://t.me/throwunless)
- **created**: 18.09.2025
- **replaces**: -
- **replaced by**: -

# Summary

This proposal defines a standardized API for tokenized vaults on the TON blockchain, built upon the [TEP-74 Jetton standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) and inspired by the design principles of [ERC-4626](https://eips.ethereum.org/EIPS/eip-4626). It is adapted to TON’s **message-driven async design** and Jetton framework.

The standard supports **deposit, withdrawal, conversion rate queries, and gas operation previews**. It also introduces a standardized **cross-protocol communication interface** with unified notification mechanisms for operation results and callbacks.

By unifying these core operations, the standard enhances **composability and interoperability** in TON’s DeFi ecosystem. It reduces duplicated implementations, minimizes fragmentation across protocols, and enables developers to build consistent and efficient vault logic.

Readers are encouraged to review the [ERC-4626 standard](https://eips.ethereum.org/EIPS/eip-4626) for additional background and context.

# Motivation

While TON has a powerful asynchronous and message-driven architecture, its ecosystem is hindered by a lack of standardization for tokenized vaults. This has resulted in fragmented implementations, making protocol integration more complex.

Key issues include:

- **Inconsistent Callbacks**: Success/failure payload formats vary across implementations, which complicates subsequent operations or rollbacks in interacting protocols—especially in TON's asynchronous message-passing environment—increasing error risks.
- **Non-Uniform Query Interfaces**: Get methods use inconsistent names and structures, forcing dApps like frontends and wallets to implement custom logic for each protocol. For example, some expose only the Jetton balance, while others require applying a conversion rate to show real asset value.
- **Divergent Event Formats**: Emitted events use varied formats, making it difficult for off-chain systems to monitor and parse events uniformly.
- **Inconsistent On-Chain Rate Queries**: Vaults provide rate information through varying message-based query formats, including inconsistent opcodes and structures for both requests and responses. This forces aggregators to implement multiple custom logics, increasing development complexity and integration costs.
- **Lack of Unified Gas Estimation Methods**: No unified method to query gas consumption, making it difficult for developers to estimate interaction costs.
- **Varied Deposit/Withdrawal Processes**: Deposit and withdrawal flows and parameters differ across vaults, including how Jetton transfers and burn notifications are handled, increasing development complexity and integration costs.

These issues force protocols to develop custom adapters, increasing errors, costs, and development time.

This standard addresses these by standardizing vault interfaces, reducing integration complexity, and accelerating TON’s DeFi ecosystem growth. By aligning with proven models like ERC-4626 while adapting to TON’s asynchronous, message-driven architecture and sharding design, this standard provides a solid foundation for scalable and reliable DeFi applications on TON.

# Guide

## When to Use This Standard

Your protocol should implement this vault standard if it:

- Accepts user deposits and issues share tokens representing their claim
- Manages deposited assets (yield generation, liquidity provision, etc.)
- Allows withdrawals by burning shares for underlying assets

## Protocol Examples

| Protocol Type        | Examples      | Use Case                                         |
| -------------------- | ------------- | ------------------------------------------------ |
| **Lending**          | Morpho        | Deposit assets, receive interest-bearing tokens  |
| **Yield Aggregator** | Yearn Finance | Auto-compound yields across strategies           |
| **Liquid Staking**   | Rocket Pool   | Stake tokens, receive liquid staking derivatives |
| **Stablecoin**       | Ethena        | Collateralized yield-bearing stablecoins         |
| **Liquidity Pools**  | Balancer      | LP tokens wrapped for additional yield           |

## Implementation

Developers can find the reference implementation with complete examples and tests at:
👉 **[github.com/torch-core/tep-vault-standard](https://github.com/torch-core/tep-vault-standard)**

# Specification

All tokenized vaults implementing this standard MUST implement the [TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) Jetton standard to represent shares. Shares represent partial ownership of the vault’s underlying assets.

For non-transferable vaults, the Jetton Wallet MAY adopt a status flag mechanism—similar to the approach used in [stablecoin contracts](https://github.com/ton-blockchain/stablecoin-contract/blob/56fd5b983f18288d42d65ab9c937f3637e27fa0d/contracts/jetton-wallet.fc#L11)—to restrict transfers.

All vaults implementing this standard MUST implement [`TEP-64`](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md) Jetton metadata. The `name` and `symbol` functions SHOULD reflect the underlying asset’s name and symbol to some extent.

## Definitions

- **`asset`**: The underlying token managed by the vault, which supports managing multiple underlying assets.
- **`share`**: Jetton issued by the vault, representing a claim on underlying assets with a conversion rate defined by the vault during deposit/withdrawal.
- **`fee`**: Amounts of assets or shares charged by the vault, applicable to deposits, yields, assets under management (AUM), withdrawals, or other vault-specified items.
- **`slippage`**: The difference between the advertised share price and the actual economic outcome during deposit/withdrawal, excluding fees.
- **`baseAsset`**: The primary or default underlying asset for vault calculations, used for standardization in multi-asset scenarios. For single-asset vaults, it is the sole asset. If no other specified asset is provided, the vault will utilize the base asset for exchange rate conversions and output standardization, to ensure operational consistency and simplify integrations.
- **`XXX_FP`**: Operations ending with `_FP` (e.g., `OP_DEPOSIT_FP`) use `forwardPayload` (Jetton) or `customPayload` (Burn) fields. Operations without `_FP` (e.g., `OP_DEPOSIT`) involve direct TON transfers.
- **`XXX_EC`**: Operations ending with `_EC` (e.g., `OP_DEPOSIT_EC`) handle Extra Currency transfers. Operations without `_EC` handle TON or Jetton transfers.
- **`in.valueCoins`**: From Tolk's notation, represents the TON coins attached to the message sent to the vault contract. FunC has the same field.
- **`in.senderAddress`**: From Tolk's notation, represents the address interacting with the vault contract. For example, if a vault's Jetton wallet sends a message to the vault, then the vault's Jetton wallet is the `in.senderAddress`. FunC has the same field.

### General Types

- **`Opcode`** <a id="opcode"></a>: `uint32`
- **`QueryId`** <a id="queryid"></a>: `uint64`
- **`ExtraCurrencyId`** <a id="extracurrencyid"></a>: `int32`
- **`Timestamp`** <a id="timestamp"></a>: `uint32`
- **`RoundingType`** <a id="roundingtype"></a>: `uint2`
  - `ROUND_DOWN = 0`
  - `ROUND_UP = 1`
  - `ROUND_HALF_UP = 2` — standard rounding (i.e., round half up)
- **`ResultCode`** <a id="resultcode"></a>: `uint16`
  - Outcome of the vault operation.
  - Values:
    - `0` (success)
    - Error codes (e.g., `1000`: Insufficient amount, `2000`: Limit exceeded).
- **`Asset`** <a id="asset"></a>: Represents various asset types (TON, Jetton, Extra Currency) using a compact encoding scheme for unified handling.

  **Format**  
   Each asset is encoded using a 4-bit prefix, followed by type-specific data:

  | Prefix (bin) | Type               | Additional Data                   |
  | ------------ | ------------------ | --------------------------------- |
  | `0000`       | **TON (native)**   | —                                 |
  | `0001`       | **Jetton**         | `jettonMasterAddress` (`Address`) |
  | `0010`       | **Extra Currency** | `tokenId` (`int32`)              |

  **Encoding Examples (Tolk)**

  ```tolk
  struct (0x0) TonAsset {}

  struct (0x1) JettonAsset {
      jettonMaster: address;
  }

  struct (0x2) ExtraCurrencyAsset {
    extraCurrencyId: ExtraCurrencyId;
  }
  ```

- **`Nested<Cell<T>>`** <a id="nestedcellt"></a>: Because TON's Cell can have at most 4 references, if you need to store more than 4 references of the same type data structure, we will enable `Nested<Cell<T>>`, where access is such that 1 cell holds at most 3 references, and the remaining one reference is used to connect to the next layer cell, and then the next layer cell can continue to store at most 3 references and so on, as shown in the diagram below.
  ![nested-cell](../assets/0524-vault-standard/nested-cell.png)

- **`VaultStateAfter`** <a id="vaultstateafter"></a>: Represents the vault's state after an operation (deposit, withdraw, or quote).

  | Field              | Type    | Description                                                                                                                                                    |
  | ------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `totalSupply`      | `Coins` | Total shares in circulation after the operation.                                                                                                               |
  | `totalAssetAmount` | `Coins` | Total amount of the relevant asset held by the vault after the operation (deposit asset for deposits, withdraw asset for withdrawals, quote asset for quotes). |

- **`TL-B for General Types`**

  ```tlb
  opcode$_ value:uint32 = Opcode;
  query_id$_ value:uint64 = QueryId;
  extra_currency_id$_ value:int32 = ExtraCurrencyId;
  timestamp$_ value:uint32 = Timestamp;

  rounding_down$00 = RoundingType;
  rounding_up$01 = RoundingType;
  rounding_half_up$10 = RoundingType;

  result_code$_ value:uint16 = ResultCode;

  ton_asset$0000 = Asset;
  jetton_asset$0001 jetton_master:MsgAddress = Asset;
  extra_currency_asset$0010 currency_id:ExtraCurrencyId = Asset;

  nested#_ {T:Type}
    item1:(Maybe ^T)
    item2:(Maybe ^T)
    item3:(Maybe ^T)
    next:(Maybe ^Nested T) = Nested T;

  vault_state_after$_
    total_supply:Coins
    total_asset_amount:Coins = VaultStateAfter;
  ```

### Storage

- Vault contracts MUST implement storage fields sufficient to fulfill the TEP-74 Jetton standard, as shares are represented as Jetton.
- Jetton metadata SHOULD include both the vault provider's information and the underlying asset's details in the token metadata, compliant with TEP-64 Token Data Standard.
- MUST provide adequate storage to support all required message handlers and functions defined below.

#### Implementation Guidance

The specific storage structure for managing underlying assets, Jetton wallets, and other vault operations is left to the implementation. Developers are encouraged to reference the [reference implementation](./contracts/storage.tolk) for guidance on storage design patterns.

### Internal Messages

> **TON Balance Preservation**: Any message that interacts with the Vault SHOULD NOT decrease its TON balance after completion, or alternatively, the Vault MUST maintain a minimum TON balance at all times — in both cases excluding TON amounts legitimately deposited by users or withdrawn by users. This ensures the Vault contract cannot be frozen due to insufficient TON.

> **Share Minting**: When minting shares for successful deposits, vault implementations SHOULD use the TEP-74 recommended `internal_transfer` format for consistency across all vault implementations:
>
> ```
> internal_transfer  query_id:QueryId amount:(VarUInteger 16) from:MsgAddress
>                      response_address:MsgAddress
>                      forward_ton_amount:(VarUInteger 16)
>                      forward_payload:(Either Cell ^Cell)
>                      = InternalMsgBody;
> ```
>
> The `forward_payload` MUST contain [VaultNotifiactionFp](#op_vault_notification_fp) for successful deposits.

**Vault Notification**

![vault-notification](../assets/0524-vault-standard/vault-notification.png)

- **Description**: After vault interaction (`Deposit` or `Withdraw`), the vault sends a notification message to the `receiver` or `initiator`, with user-defined callback payloads for further operations.

- **Messages**:

  - **`VaultOptions`** <a id="vaultoptions"></a>

    | Field            | Type  | Description                                                                                                                                                                                                                            |
    | ---------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | _(user-defined)_ | `any` | Optional parameters used across deposit, withdraw, and query quote messages. Its structure is not predefined — developers may include data such as **off-chain computed prices**, **signature payloads**, or **referral information**. |

  - **`VaultConfig`** <a id="vaultconfig"></a>

    | Field            | Type  | Description                                                                                                                                                                    |
    | ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | _(user-defined)_ | `any` | Internal configuration data resolved from [VaultOptions](#vaultoptions). Represents processed and validated parameters, such as a **verified price** used in vault operations. |

  - **`CallbackParams`** <a id="callbackparams"></a>

    | Field         | Type   | Description                                                                                                                  |
    | ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
    | `includeBody` | `Bool` | Whether to include the Vault interaction message payload (e.g., `OP_DEPOSIT`) in the response to the `receiver`/`initiator`. |
    | `payload`     | `Cell` | If defined, sends user-defined callback payload to `receiver` (on success) or `initiator` (on failure).                      |

  - **`Callbacks`** <a id="callbacks"></a>

    | Field             | Type                                     | Description                                                                    |
    | ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
    | `successCallback` | Cell<[CallbackParams](#callbackparams)>? | Sends `successCallback.payload` to `receiver` on successful vault interaction. |
    | `failureCallback` | Cell<[CallbackParams](#callbackparams)>? | Sends `failureCallback.payload` to `initiator` on failed vault interaction.    |

  - **`VaultNotificationParams`** <a id="vaultnotificationparams"></a>

    | Field             | Type                      | Description                                                                                                                                     |
    | ----------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
    | `resultCode`      | [ResultCode](#resultcode) | Outcome of the vault operation.                                                                                                                 |
    | `initiator`       | `Address`                 | Address initiating the vault interaction.                                                                                                       |
    | `callbackPayload` | `Cell?`                   | `successCallback.payload` (on success) or `failureCallback.payload` (on failure). `Null` if not specified in [CallbackParams](#callbackparams). |
    | `inBody`          | `Cell?`                   | The vault Interaction message payload if `includeBody` is `true`; otherwise, `Null`.                                                            |

  - **`OP_VAULT_NOTIFICATION`** <a id="op_vault_notification"></a>: For withdrawing or refunding TON.

    | Field                     | Type                                                | Description              |
    | ------------------------- | --------------------------------------------------- | ------------------------ |
    | `OP_VAULT_NOTIFICATION`   | [Opcode](#opcode)                                   | `0x86eba146`             |
    | `queryId`                 | [QueryId](#queryid)                                 | Unique query identifier. |
    | `vaultNotificationParams` | [VaultNotificationParams](#vaultnotificationparams) |                          |

  - **`OP_VAULT_NOTIFICATION_FP`** <a id="op_vault_notification_fp"></a>: For minting shares, withdrawing, or refunding Jetton.

    | Field                      | Type                                                | Description  |
    | -------------------------- | --------------------------------------------------- | ------------ |
    | `OP_VAULT_NOTIFICATION_FP` | [Opcode](#opcode)                                   | `0xb00d7656` |
    | `vaultNotificationParams`  | [VaultNotificationParams](#vaultnotificationparams) |              |

  - **`OP_VAULT_NOTIFICATION_EC`** <a id="op_vault_notification_ec"></a>: For withdrawing or refunding Extra Currency.

    | Field                      | Type                                                | Description  |
    | -------------------------- | --------------------------------------------------- | ------------ |
    | `OP_VAULT_NOTIFICATION_EC` | [Opcode](#opcode)                                   | `0x1f9e644b` |
    | `vaultNotificationParams`  | [VaultNotificationParams](#vaultnotificationparams) |              |

  - **`TL-B for Options, Callbacks, and Notifications`**

    ```
    vault_options$_
      custom_data:(Maybe ^Cell) = VaultOptions;

    callback_params$_
      include_body:Bool
      payload:^Cell = CallbackParams;

    callbacks$_
      success_callback:(Maybe ^CallbackParams)
      failure_callback:(Maybe ^CallbackParams) = Callbacks;

    vault_notification_params$_
      result_code:ResultCode
      initiator:MsgAddress
      callback_payload:(Maybe ^Cell)
      in_body:(Maybe ^Cell) = VaultNotificationParams;

    vault_notification#86eba146
      query_id:QueryId
      vault_notification_params:VaultNotificationParams = InternalMsgBody;

    vault_notification_fp#b00d7656
      vault_notification_params:VaultNotificationParams = ForwardPayload;

    vault_notification_ec#1f9e644b
      vault_notification_params:VaultNotificationParams = InternalMsgBody;
    ```

**Deposit (For TON)**

![deposit-ton](../assets/0524-vault-standard/deposit-ton.png)

- **Description**: Mint shares to `receiver` by depositing exactly `depositAmount` of TON.
- **Requirements**:

  - MUST verify `in.valueCoins` covers `depositAmount` plus required gas.
  - MUST verify that TON is an accepted deposit asset for the vault.
    - If TON deposits are not supported, SHOULD throw an error and reject the transaction.
  - MUST validate `depositAmount` is greater than 0 and within vault's deposit limits.
  - MUST calculate expected shares using current vault share price and rounding rules.
  - If deposit fails for the following reasons, MUST refund TON and send [OP_VAULT_NOTIFICATION](#op_vault_notification) with `failureCallback.payload` to `initiator`:
    - `depositAmount` exceeds vault limit
    - Minted shares are less than `minShares`
  - On successful share minting, MUST send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) with `successCallback.payload` to `receiver`.
  - If `receiver` is address none, MUST set `receiver` to `initiator`.
  - MUST emit `TOPIC_DEPOSITED` event.

- **Message**:

  - **`DepositOptions`** <a id="depositoptions"></a>

    | Field            | Type                                 | Description                                                                                  |
    | ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
    | `vaultOptions`   | Cell<[VaultOptions](#vaultoptions)>? | Reference to common options shared across vault operations (deposit, withdraw, query quote). |
    | _(user-defined)_ | `any`                                | Deposit-specific parameters defined by the developer.                                        |

  - **`DepositParams`** <a id="depositparams"></a>

    | Field            | Type                                     | Description                                                |
    | ---------------- | ---------------------------------------- | ---------------------------------------------------------- |
    | `receiver`       | `Address`                                | Address receiving vault share Jetton and callback payload. |
    | `minShares`      | `Coins`                                  | Minimum shares to receive, else refund.                    |
    | `depositOptions` | Cell<[DepositOptions](#depositoptions)>? | Optional parameters (e.g., price data).                    |
    | `callbacks`      | [Callbacks](#callbacks)                  | Success and failure callbacks.                             |

  <a id="op_deposit"></a>
  | Field | Type | Description |
  |--------------|---------------|-------------|
  | `OP_DEPOSIT` | [Opcode](#opcode) | `0x5a66a4a5` |
  | `queryId` | [QueryId](#queryid) | Unique query identifier. |
  | `depositAmount`| `Coins` | TON amount to deposit. |
  | `depositParams`| [DepositParams](#depositparams) | |

**Deposit Forward Payload (For Jetton)**

![deposit-jetton](../assets/0524-vault-standard/deposit-jetton.png)

- **Description**: Mint shares to `receiver` by depositing exactly `depositAmount` of Jetton.
- **Requirements**:

  - MUST verify `in.valueCoins` covers required gas.
  - MUST verify that Jetton is an accepted deposit asset for the vault.
    - MUST verify the deposit comes from the correct Jetton wallet address.
    - If Jetton deposits are not supported or the specific Jetton is not supported, SHOULD throw an error and reject the transaction.
  - MUST validate `depositAmount` is greater than 0 and within vault's deposit limits.
  - MUST calculate expected shares using current vault share price and rounding rules.
  - If deposit fails for the following reasons, MUST refund Jetton and send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) with `failureCallback.payload` to `initiator`:
    - `depositAmount` exceeds vault limit
    - Minted shares are less than `minShares`
  - On successful share minting, MUST send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) with `successCallback.payload` to `receiver`.
  - If `receiver` is address none, MUST set `receiver` to `initiator`.
  - MUST emit `TOPIC_DEPOSITED` event.

- **Message**:

  <a id="op_deposit_fp"></a>
  | Field | Type | Description |
  |---------------|---------------|-------------|
  | `OP_DEPOSIT_FP` | [Opcode](#opcode) | `0xb534fe7b` |
  | `depositParams` | [DepositParams](#depositparams) | Deposit parameters. |

**Deposit (For Extra Currency)**

![deposit-ec](../assets/0524-vault-standard/deposit-ec.png)

- **Description**: Mint shares to `receiver` by depositing exactly `depositAmount` of Extra Currency.
- **Requirements**:

  - MUST verify `in.valueCoins` covers required gas.
  - MUST verify that Extra Currency is an accepted deposit asset for the vault.
    - MUST verify that the specific Extra Currency ID is supported by the vault.
    - MUST verify that exactly one Extra Currency is deposited (multiple Extra Currencies in a single transaction are not allowed).
    - If Extra Currency deposits are not supported, the specific ID is not supported, or multiple Extra Currencies are deposited, SHOULD throw an error and reject the transaction.
  - MUST validate `depositAmount` is greater than 0 and within vault's deposit limits.
  - MUST calculate expected shares using current vault share price and rounding rules.
  - If deposit fails for the following reasons, MUST refund Extra Currency and send [OP_VAULT_NOTIFICATION_EC](#op_vault_notification_ec) with `failureCallback.payload` to `initiator`:
    - `depositAmount` exceeds vault limit
    - Minted shares are less than `minShares`
  - On successful share minting, MUST send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) with `successCallback.payload` to `receiver`.
  - If `receiver` is address none, MUST set `receiver` to `initiator`.
  - MUST emit `TOPIC_DEPOSITED` event.

- **Message**:

  - **`DepositEc`** <a id="op_deposit_ec"></a>

  | Field           | Type                            | Description              |
  | --------------- | ------------------------------- | ------------------------ |
  | `OP_DEPOSIT_EC` | [Opcode](#opcode)               | `0x90c2258a`             |
  | `queryId`       | [QueryId](#queryid)             | Unique query identifier. |
  | `depositParams` | [DepositParams](#depositparams) |                          |

- **`TL-B for Deposit`**

  ```
  deposit_params$_
    receiver:MsgAddress
    min_shares:Coins
    deposit_options:(Maybe ^DepositOptions)
    callbacks:Callbacks = DepositParams;

  deposit_options$_
    vault_options:(Maybe ^VaultOptions)
    custom_data:(Maybe ^Cell) = DepositOptions;

  deposit#5a66a4a5
    query_id:QueryId
    deposit_amount:Coins
    deposit_params:DepositParams = InternalMsgBody;

  deposit_fp#b534fe7b
    deposit_params:DepositParams = ForwardPayload;

  deposit_ec#90c2258a
    query_id:QueryId
    deposit_params:DepositParams = InternalMsgBody;
  ```

**Withdraw (In Burn Notification)**

![withdraw](../assets/0524-vault-standard/withdraw.png)

- **Description**: Burns exactly `shares` from `initiator` and sends underlying assets to `receiver`.
- **Requirements**:

  - MUST verify `in.valueCoins` covers required gas.
  - MUST verify `in.senderAddress` is the Jetton Wallet of the shares, not another Jetton wallet.
  - For multi-asset vaults, MUST verify that the withdrawal asset is supported by the vault.
  - If withdrawal fails for the following reasons, MUST refund shares and send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) with `failureCallback.payload` to `initiator`:
    - Burned shares exceed vault limit
    - Withdrawn amount is less than `minWithdraw`
  - On successful withdrawal, MUST send [OP_VAULT_NOTIFICATION_FP](#op_vault_notification_fp) (for Jetton), [OP_VAULT_NOTIFICATION_EC](#op_vault_notification_ec) (for Extra Currency), or [OP_VAULT_NOTIFICATION](#op_vault_notification) (for TON) with `successCallback.payload` to `receiver`.
  - If `receiver` is address none, MUST set `receiver` to `initiator`.
  - MUST emit `TOPIC_WITHDRAWN` event.

- **Message**:

  - **`WithdrawOptions`** <a id="withdrawoptions"></a>

    | Field            | Type                                 | Description                                                                                  |
    | ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
    | `vaultOptions`   | Cell<[VaultOptions](#vaultoptions)>? | Reference to common options shared across vault operations (deposit, withdraw, query quote). |
    | _(user-defined)_ | `any`                                | Withdraw-specific parameters defined by the developer.                                       |

  <a id="op_withdraw_fp"></a>
  | Field | Type | Description |
  |---------------------|------------------------|-------------|
  | `OP_WITHDRAW_FP` | [Opcode](#opcode) | `0xecb4d6bf` |
  | `receiver` | `Address` | Address receiving withdrawn assets. |
  | `minWithdraw` | `Coins` | Minimum asset amount to receive, else refund. |
  | `withdrawOptions` | Cell<[WithdrawOptions](#withdrawoptions)>? | Optional parameters (e.g., price data). |
  | `callbacks` | [Callbacks](#callbacks) | Success/failure callbacks. |

- **`TL-B for Withdraw`**

  ```
  withdraw_options$_
    vault_options:(Maybe ^VaultOptions)
    custom_data:(Maybe ^Cell) = WithdrawOptions;

  withdraw_fp#ecb4d6bf
    receiver:MsgAddress
    min_withdraw:Coins
    withdraw_options:(Maybe ^WithdrawOptions)
    callbacks:Callbacks = CustomPayload;
  ```

**Provide Quote and Take Quote**

![quote](../assets/0524-vault-standard/quote.png)

- **Description**: Fetches current asset-to-share conversion information from the vault.
- **Requirements**:

  - MUST verify `in.valueCoins` covers gas for Provide Quote.
  - MUST send [OP_TAKE_QUOTE](#op_take_quote) to `receiver`.
  - If `receiver` is address none, MUST set `receiver` to `initiator`.
  - MAY emit `TOPIC_QUOTED` event.

- **Messages**:

  - **`QuoteOptions`** <a id="quoteoptions"></a>

    | Field            | Type                                 | Description                                                                                  |
    | ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
    | `vaultOptions`   | Cell<[VaultOptions](#vaultoptions)>? | Reference to common options shared across vault operations (deposit, withdraw, query quote). |
    | _(user-defined)_ | `any`                                | Quote-specific parameters defined by the developer.                                          |

  <a id="op_provide_quote"></a>

  - **`OP_PROVIDE_QUOTE`**:

    | Field              | Type                                 | Description                                                                                                                                                                                  |
    | ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `OP_PROVIDE_QUOTE` | [Opcode](#opcode)                    | `0xc643cc91`                                                                                                                                                                                 |
    | `queryId`          | [QueryId](#queryid)                  | Unique query identifier.                                                                                                                                                                     |
    | `quoteAsset`       | Cell<[Asset](#asset)>?               | For vaults that support multiple assets, quoteAsset is used as the basis for calculating the exchange rate. If this field is null, the exchange rate will be calculated using the baseAsset. |
    | `receiver`         | `Address`                            | Address receiving `OP_TAKE_QUOTE`.                                                                                                                                                           |
    | `quoteOptions`     | Cell<[QuoteOptions](#quoteoptions)>? | Additional data for asset/share calculations.                                                                                                                                                |
    | `forwardPayload`   | `Cell`                               | Initiator-defined payload for further `receiver` operations. This can include custom fields such as `validUntil`                                                                             |

  <a id="op_take_quote"></a>

  - **`OP_TAKE_QUOTE`**:

    | Field            | Type                    | Description                                               |
    | ---------------- | ----------------------- | --------------------------------------------------------- |
    | `OP_TAKE_QUOTE`  | [Opcode](#opcode)       | `0x68ec31ea`                                              |
    | `queryId`        | [QueryId](#queryid)     | Unique query identifier.                                  |
    | `initiator`      | `Address`               | Address sending `OP_PROVIDE_QUOTE`.                       |
    | `quoteAsset`     | Cell<[Asset](#asset)>   | Asset used as the basis for normalizing total assets.     |
    | `totalSupply`    | `Coins`                 | Total vault shares.                                       |
    | `totalAssets`    | `Coins`                 | Total underlying assets normalized to the quote asset.    |
    | `timestamp`      | [Timestamp](#timestamp) | Timestamp of `totalSupply` and `totalAssets` calculation. |
    | `forwardPayload` | `Cell?`                 | Initiator-defined payload.                                |

  - **`TL-B for provide and take quote`**

    ```
    quote_options$_
      vault_options:(Maybe ^VaultOptions)
      custom_data:(Maybe ^Cell) = QuoteOptions;

    provide_quote#c643cc91
      query_id:QueryId
      quote_asset:(Maybe ^Asset)
      receiver:MsgAddress
      quote_options:(Maybe ^QuoteOptions)
      forward_payload:^Cell = InternalMsgBody;

    take_quote#68ec31ea
      query_id:QueryId
      initiator:MsgAddress
      quote_asset:^Asset
      total_supply:Coins
      total_assets:Coins
      timestamp:Timestamp
      forward_payload:(Maybe ^Cell) = InternalMsgBody;

    ```

### Functions and Get-Methods

Vaults implementing this standard MUST implement the following functions for querying vault state and conversion rates. Each function has two forms:

- **Internal Function**:
  - Core logic for calculations, used within vault operations (e.g., deposit/withdraw).
  - Parameters SHOULD use resolved configurations derived from user options, which MAY be implemented as parsed or validated data (e.g., structs in Tolk).
- **Get-Method**:

  - Exposed query method (e.g., `getConvertToShares`) that wraps the internal function.
  - It accepts user-provided options (e.g., [DepositOptions](#depositoptions) or [VaultOptions](#vaultoptions) as Cell), resolves them into the corresponding configs, and then passes the resolved configs to the internal function. This method is callable off-chain without gas costs.
    ![options-params](../assets/0524-vault-standard/option.png)

- **`totalAssets`**

  - **Description**:
    - Returns the total underlying assets managed by the vault.
    - For multi-asset vaults, calculations may use a quote asset specified in the `vaultConfig` for exchange rate conversions; if not specified, the base asset is used.
  - **Requirements**:
    - SHOULD include compounding from yield.
    - MUST include fees charged against assets.
    - For multi-asset vaults, SHOULD use the quote asset for normalization if specified; otherwise, use base asset.
  - **Input**:
    | Field | Type | Description |
    |---------------|----------------|-------------|
    | `vaultConfig` | [VaultConfig](#vaultconfig)? | Resolved internal config (e.g., for exchange rates in multi-asset scenarios). |

    _Note: For the get-method (`getTotalAssets`), replace `vaultConfig` with `vaultOptionsCell`: Cell<[VaultOptions](#vaultoptions)>?. The get-method should resolve `vaultOptionsCell` into `vaultConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |----------------------|---------|--------------------------------------------------|
    | `totalManagedAssets` | `Coins` | Total managed assets (normalized if quote asset specified in multi-asset vaults). |

- **`convertToShares`**

  - **Description**:
    - Estimates the number of shares that would be minted for a given asset amount in an ideal scenario.
    - For multi-asset vaults, calculations may use a quote asset specified in the `vaultConfig` for exchange rate conversions; if not specified, the base asset is used.
  - **Requirements**:
    - MUST NOT include fees charged against assets.
    - MUST NOT vary by sender.
    - MUST NOT reflect slippage or on-chain conditions.
    - MUST NOT revert unless due to integer overflow from unreasonably large input or if vaultOptions/vaultConfig is not provided when required.
    - MUST round down to `0`.
    - MAY NOT reflect per-user price-per-share, but SHOULD reflect the average user’s price-per-share.
    - For multi-asset vaults, SHOULD handle conversions via `vaultConfig` if needed.
  - **Input**:
    | Field | Type | Description |
    |-----------------|-------------------|-------------|
    | `assetAmount` | `Coins` | Asset amount to convert. |
    | `vaultConfig` | [VaultConfig](#vaultconfig)? | Resolved internal config (e.g., for exchange rates in multi-asset scenarios). |
    | `rounding` | [RoundingType](#roundingtype) | Rounding mode (default: `ROUND_DOWN`). |

    _Note: For the get-method (`getConvertToShares`), replace `vaultConfig` with `vaultOptionsCell`: Cell<[VaultOptions](#vaultoptions)>?. The get-method should resolve `vaultOptionsCell` into `vaultConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |----------|---------|-------------|
    | `shares` | `Coins` | Estimated shares. |

- **`convertToAssets`**

  - **Description**:
    - Estimates the amount of assets that would be received for a given share amount in an ideal scenario.
    - For multi-asset vaults, calculations may use a quote asset specified in the `vaultConfig` for exchange rate conversions; if not specified, the base asset is used.
  - **Requirements**:
    - MUST NOT include fees charged against assets.
    - MUST NOT vary by sender.
    - MUST NOT reflect slippage or on-chain conditions.
    - MUST NOT revert unless due to integer overflow from unreasonably large input or if vaultOptions/vaultConfig is not provided when required.
    - MUST round down to `0`.
    - MAY NOT reflect per-user price-per-share, but SHOULD reflect the average user’s price-per-share.
    - For multi-asset vaults, SHOULD handle conversions via vault`Config if needed.
  - **Input**:
    | Field | Type | Description |
    |------------------|--------------------|-------------|
    | `shares` | `Coins` | Share amount to convert. |
    | `vaultConfig` | [VaultConfig](#vaultconfig)? | Resolved internal config (e.g., for exchange rates in multi-asset scenarios). |
    | `rounding` | [RoundingType](#roundingtype) | Rounding mode (default: `ROUND_DOWN`). |

    _Note: For the get-method (`getConvertToAssets`), replace `vaultConfig` with `vaultOptionsCell`: Cell<[VaultOptions](#vaultoptions)>?. The get-method should resolve `vaultOptionsCell` into `vaultConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |----------|---------|-------------|
    | `assets` | `Coins` | Estimated assets. |

- **`maxDeposit`**

  - **Description**:
    - Returns the maximum amount of a specific underlying asset that can be deposited into the vault for the given asset.
    - For multi-asset vaults, the specific asset to query can be specified in the `depositConfig`; if not, the base asset is used.
  - **Requirements**:
    - MUST return the maximum deposit amount for the specified asset that won't revert, underestimating if necessary.
    - Assumes the user has unlimited asset amount for the underlying asset.
    - MUST consider global or asset-specific constraints for the given asset (e.g., return `0` if deposits for that asset are disabled).
    - MAY return the maximum value of the `Coins` type if no deposit limits exist for the specified asset.
    - MAY revert if depositOptions/depositConfig is not provided when required.
    - For multi-asset vaults, SHOULD handle asset-specific limits via `depositConfig` if needed.
  - **Input**:
    | Field | Type | Description |
    |-----------------|-------------------|-------------|
    | `depositConfig` | `DepositConfig?` | Resolved internal config (e.g., for asset-specific limits in multi-asset scenarios). |

    _Note: For the get-method (`getMaxDeposit`), replace `depositConfig` with `depositOptionsCell`: Cell<[DepositOptions](#depositoptions)>?. The get-method should resolve `depositOptionsCell` into `depositConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |--------------------|---------|-------------|
    | `maxDepositAmount` | `Coins` | Maximum deposit amount for the specified asset. |

- **`previewDeposit`**

  - **Description**:
    - Simulates the deposit outcome based on the current block state.
    - For multi-asset vaults, the specific asset to query can be specified in the `depositConfig`; if not, the base asset is used.
  - **Requirements**:
    - MUST return a value as close as possible to (but not exceeding) the shares minted in an actual deposit.
    - MUST NOT consider deposit limits (e.g., `maxDeposit`); assumes deposit succeeds.
    - MUST include deposit fees, ensuring integrators are aware of them.
    - MUST NOT revert due to vault-specific global limits but MAY revert for other conditions that would cause deposit to revert.
    - Differences between `convertToShares` and `previewDeposit` indicate slippage or other losses.
    - For multi-asset vaults, SHOULD handle previews via `depositConfig` if needed.
  - **Input**:
    | Field | Type | Description |
    |-----------------|-------------------|-------------|
    | `depositAmount` | `Coins` | Asset amount to deposit. |
    | `depositConfig` | `DepositConfig?` | Resolved internal config (e.g., for exchange rates or fees in multi-asset scenarios). |

    _Note: For the get-method (`getPreviewDeposit`), replace `depositConfig` with `depositOptionsCell`: Cell<[DepositOptions](#depositoptions)>?. The get-method should resolve `depositOptionsCell` into `depositConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |----------|---------|-------------|
    | `shares` | `Coins` | Estimated shares minted. |

- **`maxWithdraw`**

  - **Description**:
    - Returns the maximum share amount that can be withdrawn from the vault for a specific underlying asset.
    - For multi-asset vaults, the specific asset to query can be specified in the `withdrawConfig`; if not, the base asset is used.
  - **Requirements**:
    - MUST return the maximum shares that can be withdrawn for the specified asset without reverting, underestimating if necessary.
    - MUST consider global or asset-specific constraints for the given asset (e.g., return `0` if withdrawals for that asset are disabled).
    - MAY return the maximum value of the `Coins` type if no withdraw limits exist for the specified asset.
    - MAY revert if withdrawOptions/withdrawConfig is not provided when required.
    - For multi-asset vaults, SHOULD handle asset-specific limits via `withdrawConfig` if needed.
  - **Input**:
    | Field | Type | Description |
    |------------------|--------------------|-------------|
    | `withdrawConfig` | `WithdrawConfig?` | Resolved internal config (e.g., for asset-specific limits in multi-asset scenarios). |

    _Note: For the get-method (`getMaxWithdraw`), replace `withdrawConfig` with `withdrawOptionsCell`: Cell<[WithdrawOptions](#withdrawoptions)>?. The get-method should resolve `withdrawOptionsCell` into `withdrawConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |-------------|---------|-------------|
    | `maxShares` | `Coins` | Maximum withdrawable shares for the specified asset. |

- **`previewWithdraw`**

  - **Description**:
    - Simulates the withdrawal outcome based on the current block state.
    - For multi-asset vaults, the specific asset to query can be specified in the `withdrawConfig`; if not, the base asset is used.
  - **Requirements**:
    - MUST return a value as close as possible to (but not exceeding) the assets withdrawn in an actual withdrawal.
    - MUST NOT consider withdrawal limits (e.g., `maxWithdraw`); assumes withdrawal succeeds.
    - MUST include withdrawal fees, ensuring integrators are aware of them.
    - MUST NOT revert due to vault-specific global limits but MAY revert for other conditions that would cause withdrawal to revert.
    - Differences between `convertToAssets` and `previewWithdraw` indicate slippage or other losses.
    - For multi-asset vaults, SHOULD handle previews via `withdrawConfig` if needed.
  - **Input**:
    | Field | Type | Description |
    |------------------|--------------------|-------------|
    | `shares` | `Coins` | Share amount to withdraw. |
    | `withdrawConfig` | `WithdrawConfig?` | Resolved internal config (e.g., for exchange rates or fees in multi-asset scenarios). |

    _Note: For the get-method (`getPreviewWithdraw`), replace `withdrawConfig` with `withdrawOptionsCell`: Cell<[WithdrawOptions](#withdrawoptions)>?. The get-method should resolve `withdrawOptionsCell` into `withdrawConfig` before calling the internal function._

  - **Output**:
    | Field | Type | Description |
    |----------|---------|-------------|
    | `assets` | `Coins` | Estimated assets withdrawn.

- **`getAssets`**
  - **Description**:
    - Returns the underlying asset(s) managed by the vault as a nested structure of Asset cells.
    - For single-asset vaults, returns a nested cell containing either the TON asset, the Jetton asset or Extra Currency asset based on the vault's configuration.
    - For multi-asset vaults, returns the `assetsCell` from storage, which is a Nested<Cell<[Asset](#asset)>> containing all supported underlying assets.
  - **Requirements**:
    - MUST return the configured underlying asset(s).
    - MUST NOT revert.
  - **Input**: None
  - **Output**:
    | Field | Type | Description |
    |----------------|------------------------|-------------|
    | `assets` | Nested<Cell<[Asset](#asset)>> | Nested cell containing the underlying asset(s).
- **`previewTonDepositFee`**

  - **Description**: Returns the gas fee required for depositing TON to the vault. This fee is charged by the vault contract to the `initiator`.
  - **Requirements**:
    - MUST exclude forward and storage fees.
    - MUST exclude fees for subsequent contract interactions (e.g., Jetton Transfer).
    - MUST NOT revert.
    - SHOULD return a conservative estimate.
  - **Input**: None
  - **Output**:

    | Field              | Type    | Description              |
    | ------------------ | ------- | ------------------------ |
    | `tonDepositGasFee` | `Coins` | Gas fee for TON deposit. |

- **`previewJettonDepositFee`**

  - **Description**: Returns the gas fee required for depositing Jetton to the vault. This fee is charged by the vault contract to the `initiator`
  - **Requirements**:
    - MUST exclude forward and storage fees.
    - MUST exclude fees for subsequent contract interactions (e.g., Jetton Transfer).
    - MUST NOT revert.
    - SHOULD return a conservative estimate.
  - **Input**: None
  - **Output**:

    | Field                 | Type    | Description                 |
    | --------------------- | ------- | --------------------------- |
    | `jettonDepositGasFee` | `Coins` | Gas fee for Jetton deposit. |

- **`previewExtraCurrencyDepositFee`**

  - **Description**: Returns the gas fee required for depositing Extra Currency to the vault. This fee is charged by the vault contract to the `initiator`
  - **Requirements**:
    - MUST exclude forward and storage fees.
    - MUST exclude fees for subsequent contract interactions (e.g., Jetton Transfer).
    - MUST NOT revert.
    - SHOULD return a conservative estimate.
  - **Input**: None
  - **Output**:

    | Field                        | Type    | Description                         |
    | ---------------------------- | ------- | ----------------------------------- |
    | `extraCurrencyDepositGasFee` | `Coins` | Gas fee for Extra Currency deposit. |

- **`previewWithdrawFee`**

  - **Description**: Returns the gas fee required for withdrawing from the vault. This fee is charged by the vault contract to the `initiator`
  - **Requirements**:
    - MUST exclude forward and storage fees.
    - MUST exclude fees for subsequent contract interactions (e.g., Jetton Transfer).
    - MUST NOT revert.
    - SHOULD return a conservative estimate.
  - **Input**: None
  - **Output**:

    | Field            | Type    | Description             |
    | ---------------- | ------- | ----------------------- |
    | `withdrawGasFee` | `Coins` | Gas fee for withdrawal. |

- **`previewProvideQuoteFee`**

  - **Description**: Returns the gas fee required for querying `totalAssets` and `totalSupply`. This fee is charged by the vault contract to the `initiator`
  - **Requirements**:
    - MUST exclude forward and storage fees.
    - MUST exclude fees for subsequent contract interactions (e.g., Jetton Transfer).
    - MUST NOT revert.
    - SHOULD return a conservative estimate.
  - **Input**: None
  - **Output**:

    | Field             | Type    | Description              |
    | ----------------- | ------- | ------------------------ |
    | `provideQuoteFee` | `Coins` | Gas fee for quote query. |

### Events

- **`Deposited`**

  - **Description**: Emitted when initiator exchanges `depositAmount` for shares, transferring them to receiver.
  - **Message**:

  <a id="topic_deposited"></a>
  | Field | Type | Description |
  |---------------------|-----------------------------|-------------|
  | `TOPIC_DEPOSITED` | [Opcode](#opcode) | `0x11475d67` |
  | `initiator` | `Address` | Address initiating the deposit. |
  | `receiver` | `Address` | Address receiving shares. |
  | `depositAsset` | Cell<[Asset](#asset)> | Deposited asset. |
  | `depositAmount` | `Coins` | Deposited asset amount. |
  | `shares` | `Coins` | Minted shares. |
  | `vaultStateAfter` | Cell<[VaultStateAfter](#vaultstateafter)> | Vault state after the deposit. |
  | `depositLogOptions` | `Cell<DepositLogOptions>?` | Custom deposit logs. |

- **`Withdrawn`**

  - **Description**: Emitted when initiator exchanges shares for assets, transferring them to receiver.
  - **Message**:

  <a id="topic_withdrawn"></a>
  | Field | Type | Description |
  |----------------------|------------------------------|-------------|
  | `TOPIC_WITHDRAWN` | [Opcode](#opcode) | `0xedfb416d` |
  | `initiator` | `Address` | Address initiating the withdrawal. |
  | `receiver` | `Address` | Address receiving assets. |
  | `withdrawAsset` | Cell<[Asset](#asset)> | Withdrawn asset. |
  | `withdrawAmount` | `Coins` | Withdrawn asset amount. |
  | `burnedShares` | `Coins` | Burned shares. |
  | `vaultStateAfter` | Cell<[VaultStateAfter](#vaultstateafter)> | Vault state after the withdrawal. |
  | `withdrawLogOptions` | `Cell<WithdrawLogOptions>?` | Custom withdrawal logs. |

- **`Quoted`**

  - **Description**: Emitted when the vault provides a quote for asset-to-share conversion, including total supply and assets at the time of calculation.
  - **Message**:

  <a id="topic_quoted"></a>
  | Field | Type | Description |
  |----------------|----------------|-------------|
  | `TOPIC_QUOTED` | [Opcode](#opcode) | `0xb7bfa697` |
  | `quoteAsset` | Cell<[Asset](#asset)> | `quoteAsset` is used as the basis for calculating the exchange rate. |
  | `initiator` | `Address` | Address initiating the quote request. |
  | `receiver` | `Address` | Address receiving the quote response. |
  | `vaultStateAfter` | Cell<[VaultStateAfter](#vaultstateafter)> | Vault state at the time of quote. |
  | `timestamp` | [Timestamp](#timestamp) | Event timestamp for off-chain indexing. |
  | `quoteLogOptions` | `Cell<QuoteLogOptions>?` | Custom quote logs. |

- **`TL-B for Events`**

  ```
  deposited#11475d67
    initiator:MsgAddress
    receiver:MsgAddress
    deposit_asset:^Asset
    deposit_amount:Coins
    shares:Coins
    vault_state_after:^VaultStateAfter
    deposit_log_options:(Maybe ^Cell) = EventBody;

  withdrawn#edfb416d
    initiator:MsgAddress
    receiver:MsgAddress
    withdraw_asset:^Asset
    withdraw_amount:Coins
    burned_shares:Coins
    vault_state_after:^VaultStateAfter
    withdraw_log_options:(Maybe ^Cell) = EventBody;

  quoted#b7bfa697
    quote_asset:^Asset
    initiator:MsgAddress
    receiver:MsgAddress
    vault_state_after:^VaultStateAfter
    timestamp:Timestamp
    quote_log_options:(Maybe ^Cell) = EventBody;
  ```

# Drawbacks

While this standard provides a standardized interface for tokenized vaults on TON, it has several limitations and potential risks that developers should consider:

- **Security Risks in Notifications**: The `VaultNotification` mechanism enhances communication between protocols for handling success or failure outcomes. However, if the vault's administrative privileges (e.g., via `adminAddress`) are compromised, an attacker could upgrade the contract and send forged messages, potentially deceiving integrated protocols. This underscores the need for robust access controls and verification in vault implementations.
- **Lack of Per-Address Limits**: The standard does not include built-in restrictions on deposit or withdrawal amounts for individual addresses.
- **Timeliness Issues in Quotes**: The provide and take quote mechanisms may suffer from delays inherent to TON's asynchronous messaging architecture. Quotes are calculated based on the vault's state at the moment of computation, including its current `totalSupply` and `totalAssets`. However, by the time the quote is received, the vault's state could have changed.

These drawbacks will be further explored in the Rationale and Alternatives section, where we explain potential solutions and design choices to address them.

# Rationale and Alternatives

The vault interface follows ERC-4626 design principles while adapting to the unique characteristics of the TON blockchain. Key decisions, their rationale, and considered alternatives are outlined below:

## Asynchronous Notifications and Security Risks

**Rationale**: TON is an asynchronous system, making rollbacks or inter-protocol interactions challenging. Without standards, integrations become difficult and prone to vulnerabilities, such as those seen in TON from improper use of success/failure payloads. Thus, a notification system is essential for vaults, allowing interacting contracts to perform next steps based on outcomes. However, this introduces risks if the vault's admin is compromised, enabling forged messages via contract upgrades.  
**Alternatives**: To mitigate, four approaches are recommended:

1. Use multisig wallet for admin
2. Implement timelocks for upgrades, with third-party guardians independent of the admin able to cancel
3. Require dual approval for upgrades: both admin approval and independent third-party guard approval before contract updates.
4. Disable code upgrades entirely.

Many TON DeFi contracts allow upgrades. Combining Point 1 (multisig), Point 2 (timelocks), and Point 3 (dual approval) together can significantly reduce the risk of attack through multiple layers of protection, though some residual risk remains inherent in any upgradable contract system.

## Multi-Asset Support

**Rationale**: Unlike ERC-4626's single-asset model, this standard supports multi-assets for two reasons:

1. Top Ethereum vaults (e.g., Veda Labs' Boring Vault) feature multi-asset functionality
2. User experience benefits, e.g., a stablecoin vault accepting USDT/USDe/USDC avoids extra swaps, reducing uncertainty. Vaults can handle conversions post-deposit via oracles, DEX, OTC, or cross-chain liquidity for better UX.

**Alternatives**: A single-asset-only design was considered for simplicity, but it limits innovation.

## Off-Chain Data Integration via VaultOptions

**Rationale**: TON lacks on-chain price fetching like Ethereum, so off-chain data (e.g., prices) is carried via messages. [VaultOptions](#vaultoptions) allows passing such data, validated into [VaultConfig](#vaultconfig) for use.

## Asset-Based Limits Instead of Per-Address

**Rationale**: ERC-4626 limits `maxDeposit`/`maxWithdraw` per address, but this standard uses asset-based checks. On TON, querying initiator's shares on-chain is difficult without dicts (inefficient) or sub-contracts/Jetton wallets (complex).  
**Alternatives**: Per-user dict tracking was evaluated, but adds gas costs. Sub-contracts increase complexity; asset-based limits provide adequate protection without overhead.

## Omission of Mint/Redeem Functions

**Rationale**: ERC-4626's `mint` (specify shares, vault pulls assets) and `redeem` (specify assets, vault pulls shares) require wallet plugging, uncommon on TON. Omitting them aligns with user habits of direct transfers, reducing cognitive load.  
**Alternatives**: Implementing them was considered, but skipped due to low adoption and added complexity/async risks; direct transfers fit TON norms better.

## Provide/Take Quote Mechanism and Timeliness

**Rationale**: Fetching exchange rates faces Jetton balance query issues—rates may change by response time. Adding timestamps to [OP_TAKE_QUOTE](#op_take_quote) lets `receiver` validate freshness. We believe the timestamp generated during rate calculation is sufficient for judging staleness. If stricter control over the entire process is needed, developers can embed a `validUntil` field in `forwardPayload` for custom expiration checks.

## Slippage Protection via minShares/minWithdraw

**Rationale**: Adding `minShares`/`minWithdraw` checks in deposit/withdraw refunds on failure, protecting against rate volatility for better UX.

## Mitigation of Donation Attacks

**Rationale**: No donation attacks per design, as transfers require valid payloads and will not update the vault's storage. Direct transfers without valid payloads are ignored, preventing manipulation.

## Gas Estimation for Developer Experience

**Rationale**: TON interactions often fail due to insufficient TON despite docs. Preview fees (e.g., `previewDeposit`) let developers estimate costs, reducing errors and improving DX.

These design choices address the limitations outlined in the Drawbacks section, with unresolved questions and future extensions explored in subsequent sections.

# Prior Art

- `ERC-4626`: Tokenized Vault Standard for Ethereum, providing the foundational design for deposit, withdrawal, and conversion functions ([EIP-4626](https://eips.ethereum.org/EIPS/eip-4626)).
- `TEP-74`: Jetton Standard for TON, defining fungible token mechanics ([TEP-74](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)).
- `TEP-64`: Token Data Standard for Jetton metadata ([TEP-64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)).

# Unresolved Questions

This section highlights open questions that remain unresolved in the current draft. These are areas for potential community feedback or further research:

- **Admin Security Risks**: Even with multisig admins, timelock upgrades, and third-party monitoring to prevent illicit contract updates, there remains inherent risk in upgradable vaults. Beyond fully disabling code upgrades, no 100% foolproof method exists to eliminate compromise risks, particularly in a dynamic DeFi environment. How can protocols further harden against this without sacrificing maintainability? This ties into Drawbacks' notification security concerns and invites exploration in implementations.

# Future Possibilities

This standard establishes a solid foundation for TON vaults, with potential for evolution as the ecosystem advances. The following extensions build on the current design:

- **Mint and Redeem Functions via Wallet Plugging**: If wallet plugging becomes more widespread on TON, future versions could incorporate ERC-4626-style mint/redeem operations, enhancing flexibility for direct asset pulls while aligning with evolving user habits.
- **Gasless Vault Operations**: To improve UX, extensions could support gasless interactions, reducing barriers for deposits/withdrawals without compromising security.

These possibilities depend on TON's technical progress and community input. Contributions via discussions or PRs are encouraged to develop them further.

# Backwards Compatibility

This standard extends the **TEP-74 Jetton** standard, ensuring compatibility with existing Jetton contracts. Crucially, this extension also integrates with the **TEP-64 Token Data** standard.
