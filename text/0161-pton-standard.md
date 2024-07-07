- **TEP**: [161](https://github.com/ton-blockchain/TEPs/pull/161)
- **title**: Proxy TON for DeFi applications
- **status**: Draft
- **type**: Contract Interface
- **authors**: [STON.fi](https://ston.fi), [Dario Tarantini](https://github.com/dariotarantini)
- **created**: 13.06.2024
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for tokenized TON. Partially implement TEP-74 standard.

# Motivation

A standard interface will greatly simplify interaction and usage of TON in dApps. An application can only focus on handling standard jetton calls, while still being able to use native TON without the need of additional logic for it.

# Guide

## Useful links

1. [Reference pTON implementation](https://github.com/ston-fi/pton-contracts)

# Specification

Proxy TON must be organized as follows: there is minter smart-contract which is used to mint new wallets and provide common information. Total supply must be 0, since minter can't know how many tokenized tokens there are in all wallets.

At the same time information about amount of tokenized TON owned by each user is stores in decentralized manner in individual (for each owner) smart-contracts called "wallets".

## Wallet Contract

Must implement:

### Internal message handlers

#### 1. `ton_transfer`

##### Request

TL-B schema of inbound message:

```
ton_transfer#1f3835d
   query_id:uint64 
   ton_amount:Coins 
   refund_address:MsgAddress 
   forward_payload:(Either Cell ^Cell) 
= InternalMsgBody;
```

`query_id` - arbitrary request number.

`ton_amount` - amount of transferred TON in elementary units.

`refund_address` - address of the the refund tx, if execution fails.

`forward_payload` - optional custom data that should be sent to the wallet owner address.

**Should be rejected if:**

1. `ton_amount` is zero
2. `refund_address` is not `addr_std`
3. message value is less or equal than `ton_amount`
4. outgoing messages fails
5. if rejected, should send a `ton_refund` message with following layout TL-B: `ton_refund#ae25d79e query_id:uint64 = InternalMsgBody`

**Otherwise should do:**

1. increase internal jetton balance by `ton_amount`
2. the receiver's jetton-wallet send message to `owner` address with unused gas attached and with the TEP-74 `transfer_notification` message body

#### 2. `transfer`

##### Request

TL-B schema of inbound message:

```
transfer#0f8a7ea5 
   query_id:uint64 
   amount:(VarUInteger 16) 
   destination:MsgAddress
   response_destination:MsgAddress 
   custom_payload:(Maybe ^Cell)
   forward_ton_amount:(VarUInteger 16) 
   forward_payload:(Either Cell ^Cell)
= InternalMsgBody;
```

`query_id` - arbitrary request number

`amount` - amount of transferred TON in elementary units

`destination` - recipient that will receive TON

`response_destination` - ignored

`custom_payload` - ignored

`forward_ton_amount` - ignored

`forward_payload` - optional custom data that should be sent to the destination address

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough tokenized ton on the sender wallet
3. there is no enough TON (with respect to jetton own storage fee guidelines and operation costs) to process operation

**Otherwise should do:**

1. decrease ton balance on sender wallet by `amount`
2. send a message to receiver with the `ton_transfer` layout described above

#### 3. `internal_deploy`

##### Request

TL-B schema of inbound message:

```
internal_deploy#6540cf85
   query_id:uint64 
   excesses_address:MsgAddress 
= InternalMsgBody;
```

`query_id` - arbitrary request number

`excesses_address` - address that will receive excesses after contract deployment

**Should be rejected if:**

1. sender is not the minter

**Otherwise should do:**

1. send excesses with following layout
   TL-B:

```
excesses#d53276db query_id:uint64 = InternalMsgBody;
```

#### 3. `reset_gas`

##### Request

TL-B schema of inbound message:

```
reset_gas#29d22935
   query_id:uint64 
= InternalMsgBody;
```

`query_id` - arbitrary request number

**Should be rejected if:**

1. sender is not the owner

**Otherwise should do:**

1. send all non tokenized balance plus unused gas back to owner with following layout
   TL-B:

```
excesses#d53276db query_id:uint64 = InternalMsgBody;
```

### Get-methods

1. `get_wallet_data()` returns `(int balance, slice owner, slice jetton, cell jetton_wallet_code)`
   `balance` - (uint256) amount of jettons on wallet.
   `owner` - (MsgAddress) address of wallet owner;
   `jetton` - (MsgAddress) address of Jetton minter-address;
   `jetton_wallet_code` - (cell) with code of this wallet;

## Minter contract

Minter contract must implement TEP-89 interfaces.

### Internal message handlers

#### 1. `deploy_wallet`

##### Request

TL-B schema of inbound message:

```
deploy_wallet#4f5f4313
   query_id:uint64 
   owner_address:MsgAddress 
   excesses_address:MsgAddress 
= InternalMsgBody;
```

`query_id` - arbitrary request number

`ton_amount` - amount of transferred TON in elementary units

`owner_address` - address of the owner of the contract

`excesses_address` - address that will receive the excesses after deployment 

**Should be rejected if:**

1. incoming message value is too low for gas processing
2. `owner_address` and `excesses_address` doesn't belong to the same workchain as the contract

**Otherwise should do:**

1. send message to new wallet contract with state init and `internal_deploy` message layout, initialize the wallet and send back excesses to the specified address

### Get-methods

1. `get_jetton_data()` returns `(int total_supply, int mintable, slice admin_address, cell jetton_content, cell jetton_wallet_code)`
   `total_supply` - (0) - the total number of tokenized TON
   `mintable` - (-1) - flag which indicates that the number of tokenized TON can increase
   `admin_address` - (MsgAddressInt) - address of smart-contract which control Jetton
   `jetton_content` - cell - data in accordance to [Token Data Standard #64](https://github.com/ton-blockchain/TEPs/blob/minter/text/0064-token-data-standard.md)
   `jetton_wallet_code` - cell - code of wallet for that jetton
2. `get_wallet_address(slice owner_address)` return `slice jetton_wallet_address`
   Returns wallet address (MsgAddressInt) for this owner address (MsgAddressInt).

# TL-B schema

```
nothing$0 {X:Type} = Maybe X;
just$1 {X:Type} value:X = Maybe X;
left$0 {X:Type} {Y:Type} value:X = Either X Y;
right$1 {X:Type} {Y:Type} value:Y = Either X Y;
var_uint$_ {n:#} len:(#< n) value:(uint (len * 8)) = VarUInteger n;
addr_none$00 = MsgAddressExt;
addr_extern$01 len:(## 9) external_address:(bits len) = MsgAddressExt;
anycast_info$_ depth:(#<= 30) { depth >= 1 } rewrite_pfx:(bits depth) = Anycast;
addr_std$10 anycast:(Maybe Anycast) workchain_id:int8 address:bits256  = MsgAddressInt;
addr_var$11 anycast:(Maybe Anycast) addr_len:(## 9) workchain_id:int32 address:(bits addr_len) = MsgAddressInt;
_ _:MsgAddressInt = MsgAddress;
_ _:MsgAddressExt = MsgAddress;

deploy_wallet query_id:uint64 owner_address:MsgAddress excesses_address:MsgAddress = InternalMsgBody;
internal_deploy query_id:uint64 excesses_address:MsgAddress = InternalMsgBody;
ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;
reset_gas query_id:uint64 = InternalMsgBody;
ton_refund query_id:uint64 = InternalMsgBody;
excesses query_id:uint64 = InternalMsgBody;
transfer query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell) forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell) = InternalMsgBody;
transfer_notification query_id:uint64 amount:(VarUInteger 16) sender:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;
```

`crc32('ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody') = 0x81f3835d & 0x7fffffff = 0x1f3835d`
`crc32('deploy_wallet query_id:uint64 owner_address:MsgAddress excesses_address:MsgAddress = InternalMsgBody') = 0xcf5f4313 & 0x7fffffff = 0x4f5f4313`
`crc32('internal_deploy query_id:uint64 excesses_address:MsgAddress = InternalMsgBody') = 0xe540cf85 & 0x7fffffff = 0x6540cf85`
`crc32('reset_gas query_id:uint64 = InternalMsgBody') = 0xa9d22935 & 0x7fffffff = 0x29d22935`
`crc32('ton_refund query_id:uint64 = InternalMsgBody') = 0x2e25d79e | 0x80000000 = 0xae25d79e`
`crc32('excesses query_id:uint64 = InternalMsgBody') = 0x553276db | 0x80000000 = 0xd53276db`
`crc32('transfer query_id:uint64 amount:VarUInteger 16 destination:MsgAddress response_destination:MsgAddress custom_payload:Maybe ^Cell forward_ton_amount:VarUInteger 16 forward_payload:Either Cell ^Cell = InternalMsgBody') = 0x8f8a7ea5 & 0x7fffffff = 0xf8a7ea5`
`crc32('transfer_notification query_id:uint64 amount:VarUInteger 16 sender:MsgAddress forward_payload:Either Cell ^Cell = InternalMsgBody') = 0xf362d09c & 0x7fffffff = 0x7362d09c`

# Drawbacks

None.

# Rationale and alternatives

None.

# Prior art

1. [WTON](https://github.com/TonoxDeFi/WTON)
2. [EIP-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
3. [WETH](https://https://weth.io/)

# Unresolved questions

None.

# Future possibilities

None.

# Changelog

13/06/2024 - Added spec draft.
