- **TEP**: [161](https://github.com/ton-blockchain/TEPs/pull/161)
- **title**: Proxy TON for DeFi applications
- **status**: Draft
- **type**: Contract Interface
- **authors**: [STON.fi](https://ston.fi), [Dario Tarantini](https://github.com/dariotarantini)
- **created**: 13.06.2024
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for tokenized TON.

# Motivation

A standard interface will greatly simplify interaction and usage of TON in TON dApps. An application can only focus on accepting standard jetton calls, while still being able to use pTON for managing TON without the need of additional logic for TON itself. 

# Guide

## Useful links
1. [Reference pTON implementation](https://docs.ston.fi)

# Specification

TBD

## Proxy TON smart contract
Must implement:

### Internal message handlers
#### 1. `ton_transfer`
**Request**

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

**Otherwise should do:**

1. increase internal jetton balance by `ton_amount`
2. the receiver's jetton-wallet send message to `owner` address with unused gas attached and with the following layout:
   TL-B schema:

```
transfer_notification#7362d09c 
   query_id:uint64 
   amount:(VarUInteger 16)
   sender:MsgAddress 
   forward_payload:(Either Cell ^Cell)
= InternalMsgBody;
```

`query_id` should be equal with request's `query_id`.

`amount` amount of transferred jettons.

`sender` is address of the previous owner of transferred jettons.

`forward_payload` should be equal with request's `forward_payload`.

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

ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;
```

`crc32('ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody') = 0x81f3835d & 0x7fffffff = 0x1f3835d`

# Drawbacks

TBD.

# Rationale and alternatives

TBD.

# Prior art

1. [WTON](https://github.com/TonoxDeFi/WTON)
2. [EIP-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
3. [WETH](https://https://weth.io/)

# Unresolved questions

TBD.

# Future possibilities

TBD.

# Changelog

31 Aug 2022 - Added `forward_payload` format. 
