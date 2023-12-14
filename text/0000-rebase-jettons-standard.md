- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Rebase Jettons standart
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Igor Erkin](https://github.com/IgorErkin), [Konstantin Komarov](https://github.com/KonstantinK01) 
- **created**: 04.12.2023
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for Rebase Jettons. 

# Motivation
For the rebase tokens, balance of a user is calculated as follows:

`balance = shares * total_supply / total_shares;` (Equation 1)

`shares` - user share of total supply, 
`total_supply` - sum of all tokens, 
`total_shares` - sum of all user shares.

The Jetton architecture does not allow for the implementation of rebase tokens. In Jetton the `total_supply` and `total_shares` variables must be stored in the Jetton-master contract, while the `shares` variable must be stored in the Jetton-wallet contract. So if we want to rebase the balances of all users, every Jetton-wallet must send a message to the Jetton-master and receive a response with the `total_supply` and `total_shares` variables, which are necessary for the balance calculation. Given the potentially unlimited number of Jetton-wallet holders, this would require an unlimited amount of network fees for every rebase event.
The Rebase Jetton standard enables the implementation of rebase tokens, making it clear to other network participants that tokens based on this standard operate with shares rather than balances.

Rebase Jetton standard describes:
* The way of interacting with rebase jettons
* The way of transfers, minting and burning of rebase jettons

# Guide

## Useful links
1. [Reference rebase jetton implementation](https://github.com/united-finance/Rebase-Jetton)

# Specification
Here and following we use "Rebase Jetton" as designation for entirety of tokens of the same type, while "rebase jetton" as designation of amount of tokens of some type calculated by Equation 1. At the same time we use "shares" when referring to the `shares` variable displaying the user's share of the total supply.

Rebase Jettons are organized as follows: each Rebase Jetton has master smart-contract which is used to mint new rebase jettons, account for total supply, total shares and provide common information.

At the same time information about amount of shares owned by each user is stored in decentralized manner in individual (for each owner) smart-contracts called "rebase-jetton-wallets".

Example: if you release a Rebase Jetton with circulating supply of 200 rebase jettons which are owned by 3 people, then you will deploy 4 contracts: 1 Rebase-Jetton-master and 3 rebase-jetton-wallets.

Due to a vulnerability inherent to all systems that operate with shares instead of balances, the more shares correspond to 1 rebase token, the better. This problem is well-described in [this article](https://docs.openzeppelin.com/contracts/4.x/erc4626). For this reason, the `shares` variable in the rebase-jetton-wallet contract uses the VarUInteger 32 type with increased precision. As a result, rebase-jetton-wallet is not compatible with the regular jetton-wallet.

Deploying a master contract, you must set initial `total_supply` and `total_shares`. From these, you can calculate how many shares correspond to 1 rebase jetton at the initial stage. The recommended initial balance to shares ratio is: 1 nanoJetton = 10^9 shares.

## Frontend integration rules
To display rebase jettons amount, all frontend applications must:
1. retrieve `shares` from the Rebase-Jetton-wallet
2. call the `get_jetton_balance(int shares)` method of the Rebase-Jetton-master to calculate the amount of rebase jettons
3. display the calculated amount to the user

In the opposite scenario when, for example, a user initiates rebase jettons transfer through a wallet application, the application must perform the opposite operation:
1. obtain the rebase jettons amount entered by the user
2. call the `get_jetton_shares(int balance)` method of the Rebase-Jetton-master to calculate the corresponding shares amount
3. build a message to the Rebase-Jetton-wallet for transferring shares.

## Rebase Jetton wallet smart contract
Must implement:

### Internal message handlers
#### 1. `transfer`
**Request**

TL-B schema of inbound message:

```
transfer#54b95f29 query_id:uint64 shares:(VarUInteger 32) destination:MsgAddress
                 response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                 forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
                 = InternalMsgBody;
```

`query_id` - arbitrary request number.

`shares` - amount of transferred shares in elementary units.

`destination` - address of the new owner of the rebase jettons.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.

`custom_payload` - optional custom data (which is used by either sender or receiver rebase jetton wallet for inner logic).

`forward_ton_amount` - the amount of nanotons to be sent to the destination address.

`forward_payload` - optional custom data that should be sent to the destination address.

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough shares on the sender wallet.
3. there is no enough TON (with respect to rebase jetton own storage fee guidelines and operation costs) to process operation, deploy receiver's rebase-jetton-wallet and send `forward_ton_amount`.
4. After processing the request, the receiver's rebase-jetton-wallet **must** send at least `in_msg_value - forward_ton_amount - 2 * max_tx_gas_price - 2 * fwd_fee` to the `response_destination` address.
   If the sender rebase-jetton-wallet cannot guarantee this, it must immediately stop executing the request and throw error.
   `max_tx_gas_price` is the price in Toncoins of maximum transaction gas limit of FT habitat workchain. For the basechain it can be obtained from [`ConfigParam 21`](https://github.com/ton-blockchain/ton/blob/78e72d3ef8f31706f30debaf97b0d9a2dfa35475/crypto/block/block.tlb#L660) from `gas_limit` field.  `fwd_fee` is forward fee for transfer request, it can be obtained from parsing transfer request message.

**Otherwise should do:**

1. decrease shares amount on sender wallet by `shares` and send message which increase shares amount on receiver wallet (and optionally deploy it).
2. if `forward_ton_amount > 0` ensure that receiver's rebase-jetton-wallet send message to `destination` address with `forward_ton_amount` nanotons attached and with the following layout:
   TL-B schema:

```
transfer_notification#44b23ab6 query_id:uint64 shares:(VarUInteger 32)
                               sender:MsgAddress forward_payload:(Either Cell ^Cell)
                               = InternalMsgBody;
```

`query_id` should be equal with request's `query_id`.

`shares` amount of transferred shares.

`sender` is address of the previous owner of transferred shares.

`forward_payload` should be equal with request's `forward_payload`.

If `forward_ton_amount` is equal to zero, notification message should not be sent.

3. Receiver's wallet should send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.

#### `forward_payload` format

If you want to send a simple comment in the `forward_payload` then the `forward_payload` must start with `0x00000000` (32-bits unsigned integer equals to zero) and the comment is contained in the remainder of the `forward_payload`.

If comment does not begin with the byte `0xff`, the comment is a text one; it can be displayed "as is" to the end user of a wallet (after filtering invalid and control characters and checking that it is a valid UTF-8 string). 
For instance, users may indicate the purpose ("for coffee") of a simple transfer from their wallet to the wallet of another user in this text field. 

On the other hand, if the comment begins with the byte `0xff`, the remainder is a "binary comment", which should not be displayed to the end user as text (only as hex dump if necessary). 
The intended use of "binary comments" is, e.g., to contain a purchase identifier for payments in a store, to be automatically generated and processed by the store's software.

If the `forward_payload` contains a binary message for interacting with the destination smart contract (for example, with DEX), then there are no prefixes.

These rules are the same with the payload format when simply sending Toncoins from a regular wallet ([Smart Contract Guidelines: Internal Messages, 3](https://docs.ton.org/develop/smart-contracts/guidelines/internal-messages)).

#### 2. `burn`
**Request**

TL-B schema of inbound message:

```
burn#dbc5a2f9 query_id:uint64 shares:(VarUInteger 32)
              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
              = InternalMsgBody;
```

`query_id` - arbitrary request number.

`shares` - amount of burned shares.

`response_destination` - address where to send a response with confirmation of a successful burn and the rest of the incoming message coins.

`custom_payload` - optional custom data.

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough shares on the sender wallet.
3. There is no enough TONs to send after processing the request at least `in_msg_value -  max_tx_gas_price` to the `response_destination` address.
   If the sender rebase-jetton-wallet cannot guarantee this, it must immediately stop executing the request and throw error.

**Otherwise should do:**

1. decrease shares amount on burner wallet by `shares` and send notification to rebase-jetton-master with information about burn.
2. Rebase-jetton-master should send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.

### Get-methods

1. `get_wallet_data()` returns `(int shares, slice owner, slice rebase_jetton, cell rebase_jetton_wallet_code)`.

   `shares` - (VarUInt32) amount of shares on wallet.
   
   `owner` - (MsgAddress) address of wallet owner.
   
   `rebase_jetton` - (MsgAddress) address of Rebase Jetton master-address.
   
   `rebase_jetton_wallet_code` - (cell) with code of this wallet.

## Rebase Jetton master contract

### Must implement get-methods:

1. `get_rebase_jetton_data()` returns `(int total_supply, int total_shares, int mintable, slice admin_address, cell rebase_jetton_content, cell rebase_jetton_wallet_code)`.

   `total_supply` - (integer) - the total number of issued rebase jettons.

   `total_shares` - (integer) - the sum of all issued shares.

   `mintable` - (-1/0) - flag which indicates whether number of shares can increase.

   `admin_address` - (MsgAddressInt) - address of smart-contract which controls rebase-jetton_master.

   `rebase_jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md).

   `rebase_jetton_wallet_code` - cell - code of wallet for the rebase jetton.
   
3. `get_wallet_address(slice owner_address)` returns `slice rebase_jetton_wallet_address`.
   Returns rebase-jetton-wallet address (MsgAddressInt) for this owner address (MsgAddressInt).
4. `get_jetton_balance(int shares_amount)` returns `int balance`.
   Returns the rebase jettons amount (int) for the given shares amount (int).
6. `get_jetton_shares(int balance)` returns `int shares`.
   Returns the shares amount (int) for the given rebase jettons amount (int).

### Internal message handlers. Unspecified by standard, but suggested way to implement:
#### 1. `Mint`
**Request**

TL-B schema of inbound message:

```
mint#f496e3a7 query_id:uint64 to_address:MsgAddress 
              forward_amount:(VarUInteger 16) master_msg:InternalMsgBody
              = InternalMsgBody;
```

`query_id` - arbitrary request number.

`to_address` - address of the rebase-jetton-wallet owner.

`forward_ton_amount` - the amount of nanotons to be sent to the destination address.

`master_msg` - internal transfer message for further sending shares to rebase-jetton-wallet with the following layout:
TL-B schema: 
`internal_transfer#18386b06 query_id:uint64 jetton_amount:(VarUInteger 16) from:MsgAddress response_address:MsgAddress forward_ton_amount:(VarUInteger 16) forward_payload:Either Cell ^Cell;`
`query_id` - should be equal with request's `query_id`,
`jetton_amount` - amount of rebase jettons to mint,
`from` - address of the rebase-jetton-wallet owner,
`response_address` - address where to send a response with confirmation of a successful rebase jettons receipt,
`forward_ton_amount` - the amount of nanotons to be sent to the destination address,
`forward_payload` - optional custom data that should be sent to the destination address.

The smart contract extracts the `jetton_amount` variable from the `master_msg` and converts it to shares using the formula: `shares = jetton_amount * total_shares / total_supply`. It then mints the resulting amount of shares and sends them to the rebase-jetton-wallet using the same `internal_transfer` message with `shares` instead of `jetton_amount`. TL-B schema of the `internal_transfer`:
`internal_transfer#18386b06 query_id:uint64 shares:(VarUInteger 32) from:MsgAddress response_address:MsgAddress forward_ton_amount:(VarUInteger 16) forward_payload:Either Cell ^Cell;`
`shares` - amount of minted shares.

**Should be rejected if:**

1. message is not from the owner.

**Otherwise should do:**
1. increase `total_shares` in rebase-jetton-master.
2. increase `total_supply` in rebase-jetton-master.
3. send an `internal_transfer` message to rebase_jetton_wallet with information about minted shares.

#### 2. `Burn notification`

**Request**

TL-B schema of inbound message:

```
burn_notification#0aef5050 query_id:uint64 shares:(VarUInteger 32) 
                           sender:MsgAddress response_destination:MsgAddress
                           = InternalMsgBody;
```

`query_id` - arbitrary request number.

`shares` - amount of burned shares.

`sender` - address of the rebase-jetton-wallet owner.

`response_destination` - address where to send a response with confirmation of a successful shares burn.

**Should be rejected if:**

1. Message is not from sender's rebase-jetton-wallet.

**Otherwise should do:**

1. decrease the amount of `total_shares` in rebase-jetton-master.
2. decrease the amount of `total_supply` in rebase-jetton-master.
3. send all excesses of incoming message coins to response_destination with the following layout: TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;` `query_id` should be equal with request's `query_id`.

#### 3. `Change supply`
**Request**

TL-B schema of inbound message:

```
change_supply#2d43c97f query_id:uint64 new_total_supply:(VarUInteger 16) = InternalMsgBody;
```

`query_id` - arbitrary request number.

`new_total_supply` - the new value of total supply.

**Should be rejected if:**

1. message is not from the owner.

**Otherwise should do:**

1. update `total_supply` to `new_total_supply`.

# TL-B schema
```
nothing$0 {X:Type} = Maybe X;
just$1 {X:Type} value:X = Maybe X;
left$0 {X:Type} {Y:Type} value:X = Either X Y;
right$1 {X:Type} {Y:Type} value:Y = Either X Y;
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8))
         = VarUInteger n;

addr_none$00 = MsgAddressExt;
addr_extern$01 len:(## 9) external_address:(bits len)
             = MsgAddressExt;
anycast_info$_ depth:(#<= 30) { depth >= 1 }
   rewrite_pfx:(bits depth) = Anycast;
addr_std$10 anycast:(Maybe Anycast)
   workchain_id:int8 address:bits256  = MsgAddressInt;
addr_var$11 anycast:(Maybe Anycast) addr_len:(## 9)
   workchain_id:int32 address:(bits addr_len) = MsgAddressInt;
_ _:MsgAddressInt = MsgAddress;
_ _:MsgAddressExt = MsgAddress;

transfer query_id:uint64 shares:(VarUInteger 32) destination:MsgAddress
         response_destination:MsgAddress custom_payload:(Maybe ^Cell)
         forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
         = InternalMsgBody;

transfer_notification query_id:uint64 shares:(VarUInteger 32)
                      sender:MsgAddress forward_payload:(Either Cell ^Cell)
                      = InternalMsgBody;

burn query_id:uint64 shares:(VarUInteger 32)
     response_destination:MsgAddress custom_payload:Maybe ^Cell
     = InternalMsgBody;

excesses query_id:uint64 = InternalMsgBody;

// ----- Unspecified by standard, but suggested format of internal message

internal_transfer query_id:uint64 shares:(VarUInteger 32)
                  from:MsgAddress response_address:MsgAddress
                  forward_ton_amount:(VarUInteger 16) forward_payload:Either Cell ^Cell
                  = InternalMsgBody;

burn_notification query_id:uint64 shares:(VarUInteger 32)
                  sender:MsgAddress response_destination:MsgAddress
                  = InternalMsgBody;

change_supply query_id:uint64 new_total_supply:(VarUInteger 16) = InternalMsgBody;

mint query_id:uint64 to_address:MsgAddress
     forward_amount:(VarUInteger 16) master_msg:InternalMsgBody
     = InternalMsgBody;
```

`crc32('transfer query_id:uint64 shares:(VarUInteger 32) destination:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell) forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell) = InternalMsgBody') = 0x54b95f29`

`crc32('transfer_notification query_id:uint64 shares:(VarUInteger 32) sender:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody') = 0x44b23ab6`

`crc32('internal_transfer query_id:uint64 shares:(VarUInteger 32) from:MsgAddress response_address:MsgAddress forward_ton_amount:(VarUInteger 16) forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x18386b06`

`crc32('burn query_id:uint64 shares:(VarUInteger 32) response_destination:MsgAddress custom_payload:Maybe ^Cell = InternalMsgBody') = 0xdbc5a2f9`

`crc32('burn_notification query_id:uint64 shares:(VarUInteger 32) sender:MsgAddress response_destination:MsgAddress = InternalMsgBody') = 0x0aef5050`

`crc32('excesses query_id:uint64 = InternalMsgBody') = 0x553276db | 0x80000000 = 0xd53276db`

`crc32('change_supply query_id:uint64 new_total_supply:(VarUInteger 16) = InternalMsgBody') = 0x2d43c97f`

`crc32('mint query_id:uint64 to_address:MsgAddress forward_amount:(VarUInteger 16) master_msg:InternalMsgBody  = InternalMsgBody') = 0xf496e3a7`

# Drawbacks

1. There is no way to get actual wallet balance onchain, because when the message with balance will arrive, wallet balance may be not actual.
2. Vulnerability of systems working with shares. Well described in [this article](https://docs.openzeppelin.com/contracts/4.x/erc4626).

# Rationale and alternatives

In addition to Rebase Jetton, two alternatives were considered:

1. Flexible-jetton, which allows the operation of both shares and balances at the same time. Not suitable, since it allows the creation of "positive rebase only" systems.
2. Tokenized vault, a solution similar to the ERC-4626 standard. Not suitable, since it limits the set of all projects to a subset of yield-bearing tokens.

Rebase Jetton does not have these limitations and is suitable for the role of a generic standard.
[The article](https://united-finance.medium.com/overview-of-ways-to-implement-rebase-tokens-on-ton-blockchain-3e23552cf0b3) delves into the mentioned alternative architectures.

This standard is necessary in TON, because without it it is impossible to create projects based on rebase mechanics.

# Prior art

1. https://eips.ethereum.org/EIPS/eip-4626
2. https://docs.openzeppelin.com/contracts/4.x/erc4626

# Unresolved questions

1. There is no standard methods to perform "safe transfer", which will revert ownership transfer in case of contract execution failure.
2. Backward compatibility with Jettons.

# Future possibilities

None
