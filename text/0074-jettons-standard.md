- **TEP**: [74](https://github.com/ton-blockchain/TEPs/pull/4)
- **title**: Fungible tokens (Jettons) standard
- **status**: Active
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK), [Tolya](https://github.com/tolya-yanot)
- **created**: 12.03.2022
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for Jettons (TON fungible tokens).

# Motivation

A standard interface will greatly simplify interaction and display of different tokenized assets.

Jetton standard describes:

* The way of jetton transfers.
* The way of retrieving common information (name, circulating supply, etc) about given Jetton asset.

# Guide

## Useful links
1. [Reference jetton implementation](https://github.com/ton-blockchain/token-contract/)
2. [Jetton deployer](https://jetton.live/)
3. FunC Jetton lesson ([en](https://github.com/romanovichim/TonFunClessons_Eng/blob/main/lessons/smartcontract/9lesson/ninthlesson.md)/[ru](https://github.com/romanovichim/TonFunClessons_ru/blob/main/lessons/smartcontract/9lesson/ninthlesson.md))

# Specification

Here and following we use "Jetton" with capital `J` as designation for entirety of tokens of the same type, while "jetton" with `j` as designation of amount of tokens of some type.

Jettons are organized as follows: each Jetton has master smart-contract which is used to mint new jettons, account for circulating supply and provide common information.

At the same time information about amount of jettons owned by each user is stores in decentralized manner in individual (for each owner) smart-contracts called "jetton-wallets".

Example: if you release a Jetton with circulating supply of 200 jetton which are owned by 3 people, then you will deploy 4 contracts: 1 Jetton-master and 3 jetton-wallets.

## Jetton wallet smart contract
Must implement:

### Internal message handlers
#### 1. `transfer`
**Request**

TL-B schema of inbound message:

```
transfer#0f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
                 response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                 forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
                 = InternalMsgBody;
```

`query_id` - arbitrary request number.

`amount` - amount of transferred jettons in elementary units.

`destination` - address of the new owner of the jettons.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.

`custom_payload` - optional custom data (which is used by either sender or receiver jetton wallet for inner logic).

`forward_ton_amount` - the amount of nanotons to be sent to the destination address.

`forward_payload` - optional custom data that should be sent to the destination address.

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough jettons on the sender wallet
3. there is no enough TON (with respect to jetton own storage fee guidelines and operation costs) to process operation, deploy receiver's jetton-wallet and send `forward_ton_amount`.
4. After processing the request, the receiver's jetton-wallet **must** send at least `in_msg_value - forward_ton_amount - 2 * max_tx_gas_price - 2 * fwd_fee` to the `response_destination` address.
   If the sender jetton-wallet cannot guarantee this, it must immediately stop executing the request and throw error.
   `max_tx_gas_price` is the price in Toncoins of maximum transaction gas limit of FT habitat workchain. For the basechain it can be obtained from [`ConfigParam 21`](https://github.com/ton-blockchain/ton/blob/78e72d3ef8f31706f30debaf97b0d9a2dfa35475/crypto/block/block.tlb#L660) from `gas_limit` field.  `fwd_fee` is forward fee for transfer request, it can be obtained from parsing transfer request message.

**Otherwise should do:**

1. decrease jetton amount on sender wallet by `amount` and send message which increase jetton amount on receiver wallet (and optionally deploy it).
2. if `forward_amount > 0` ensure that receiver's jetton-wallet send message to `destination` address with `forward_amount` nanotons attached and with the following layout:
   TL-B schema:

```
transfer_notification#7362d09c query_id:uint64 amount:(VarUInteger 16)
                              sender:MsgAddress forward_payload:(Either Cell ^Cell)
                              = InternalMsgBody;
```

`query_id` should be equal with request's `query_id`.

`amount` amount of transferred jettons.

`sender` is address of the previous owner of transferred jettons.

`forward_payload` should be equal with request's `forward_payload`.

If `forward_amount` is equal to zero, notification message should not be sent.

3. Receiver's wallet should send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.

#### `forward_payload` format

If you want to send a simple comment in the `forward_payload` then the `forward_payload` must starts with `0x00000000` (32-bits unsigned integer equals to zero) and the comment is contained in the remainder of the `forward_payload`.

If comment does not begin with the byte `0xff`, the comment is a text one; it can be displayed "as is" to the end user of a wallet (after filtering invalid and control characters and checking that it is a valid UTF-8 string). 
For instance, users may indicate the purpose ("for coffee") of a simple transfer from their wallet to the wallet of another user in this text field. 

On the other hand, if the comment begins with the byte `0xff`, the remainder is a "binary comment", which should not be displayed to the end user as text (only as hex dump if necessary). 
The intended use of "binary comments" is, e.g., to contain a purchase identifier for payments in a store, to be automatically generated and processed by the store's software.

If the `forward_payload` contains a binary message for interacting with the destination smart contract (for example, with DEX), then there are no prefixes.

These rules are the same with the payload format when simply sending Toncoins from a regular wallet ([Smart Contract Guidelines: Internal Messages, 3](https://ton.org/docs/#/howto/smart-contract-guidelines?id=internal-messages)).

#### 2. `burn`
**Request**

TL-B schema of inbound message:

```
burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
              = InternalMsgBody;
```

`query_id` - arbitrary request number.

`amount` - amount of burned jettons

`response_destination` - address where to send a response with confirmation of a successful burn and the rest of the incoming message coins.

`custom_payload` - optional custom data.

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough jettons on the sender wallet
3. There is no enough TONs to send after processing the request at least `in_msg_value -  max_tx_gas_price` to the `response_destination` address.
   If the sender jetton-wallet cannot guarantee this, it must immediately stop executing the request and throw error.

**Otherwise should do:**

1. decrease jetton amount on burner wallet by `amount` and send notification to jetton master with information about burn.
2. Jetton master should send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.

### Get-methods
1. `get_wallet_data()` returns `(int balance, slice owner, slice jetton, cell jetton_wallet_code)`
   `balance` - (uint256) amount of jettons on wallet.
   `owner` - (MsgAddress) address of wallet owner;
   `jetton` - (MsgAddress) address of Jetton master-address;
   `jetton_wallet_code` - (cell) with code of this wallet;

## Jetton master contract
### Get-methods
1. `get_jetton_data()` returns `(int total_supply, int mintable, slice admin_address, cell jetton_content, cell jetton_wallet_code)`
   `total_supply` - (integer) - the total number of issues jettons
   `mintable` - (-1/0) - flag which indicates whether number of jettons can increase
   `admin_address` - (MsgAddressInt) - address of smart-contrac which control Jetton
   `jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md)
   `jetton_wallet_code` - cell - code of wallet for that jetton
2. `get_wallet_address(slice owner_address)` return `slice jetton_wallet_address`
   Returns jetton wallet address (MsgAddressInt) for this owner address (MsgAddressInt).

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

transfer query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
           response_destination:MsgAddress custom_payload:(Maybe ^Cell)
           forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
           = InternalMsgBody;

transfer_notification query_id:uint64 amount:(VarUInteger 16)
           sender:MsgAddress forward_payload:(Either Cell ^Cell)
           = InternalMsgBody;

excesses query_id:uint64 = InternalMsgBody;

burn query_id:uint64 amount:(VarUInteger 16)
       response_destination:MsgAddress custom_payload:(Maybe ^Cell)
       = InternalMsgBody;

// ----- Unspecified by standard, but suggested format of internal message

internal_transfer  query_id:uint64 amount:(VarUInteger 16) from:MsgAddress
                     response_address:MsgAddress
                     forward_ton_amount:(VarUInteger 16)
                     forward_payload:(Either Cell ^Cell)
                     = InternalMsgBody;
burn_notification query_id:uint64 amount:(VarUInteger 16)
       sender:MsgAddress response_destination:MsgAddress
       = InternalMsgBody;
```

`crc32('transfer query_id:uint64 amount:VarUInteger 16 destination:MsgAddress response_destination:MsgAddress custom_payload:Maybe ^Cell forward_ton_amount:VarUInteger 16 forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x8f8a7ea5 & 0x7fffffff = 0xf8a7ea5`

`crc32('transfer_notification query_id:uint64 amount:VarUInteger 16 sender:MsgAddress forward_payload:Either Cell ^Cell = InternalMsgBody') = 0xf362d09c & 0x7fffffff = 0x7362d09c`

`crc32('excesses query_id:uint64 = InternalMsgBody') = 0x553276db | 0x80000000 = 0xd53276db`

`crc32('burn query_id:uint64 amount:VarUInteger 16 response_destination:MsgAddress custom_payload:Maybe ^Cell = InternalMsgBody') = 0x595f07bc & 0x7fffffff = 0x595f07bc`

`crc32('internal_transfer query_id:uint64 amount:VarUInteger 16 from:MsgAddress response_address:MsgAddress forward_ton_amount:VarUInteger 16 forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x978d4519 & 0x7fffffff = 0x178d4519`

`crc32('burn_notification query_id:uint64 amount:VarUInteger 16 sender:MsgAddress response_destination:MsgAddress = InternalMsgBody') = 0x7bdd97de & 0x7fffffff = 0x7bdd97de`

# Drawbacks

There is no way to get actual wallet balance onchain, because when the message with balance will arrive, wallet balance may be not actual.

# Rationale and alternatives

Distributed architecture "One wallet - one contract" well described in the [NFT standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md#rationale-and-alternatives) in paragraph "Rationale".

# Prior art

1. [EIP-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
2. [Sharded Smart Contracts for Smart Contract Developers](https://www.youtube.com/watch?v=svOadLWwYaM)

# Unresolved questions

1. There is no standard methods to perform "safe transfer", which will revert ownership transfer in case of contract execution failure.

# Future possibilities

There was an idea to implement [external message tokens](https://t.me/ton_overview/35) (by [EmelyanenkoK](https://github.com/EmelyanenkoK)).

# Changelog

31 Aug 2022 - Added `forward_payload` format. 
