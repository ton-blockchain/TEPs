- **TEP**: [404]
- **title**: Semi-fungible token standard 
- **status**: Draft
- **type**: Contract Interface
- **authors**: [kojhliang](https://github.com/kojhliang), [howardpen9](https://github.com/howardpen9),[sidebyandrew](https://github.com/sidebyandrew)
- **created**: 17.03.2024
- **replaces**: -
- **replaced by**: -

# Summary

A semi-fungible token(SFT) standard that combines the [Jetton](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) and [NFT](https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md) standards with native liquidity and fractionalization, as well as full compatibility.This protocol is inspired by [ERC404]((https://github.com/Pandora-Labs-Org/erc404)), so we also refer to this standard as TRC404 protocol.

# Motivation

This protocol can increase the liquidity of NFT transactions, achieve fragmentation of NFTs, and facilitate the exchange between different NFTs.  

TEP404 standard describes:

* The way of SFT jetton transfers.
* The way of SFT NFT transfers.


# Guide

The core process of the TRC404 protocol are as following:
1.Transfer TRC404 jetton: When userA transfer an TRC404 jetton to userB,userA might burn one of userA's NFT,and TRC404 protocol might mint an new TRC404 NFT for userB.

2.Transfer TRC404 NFT: When userA transfer an TRC404 NFT to userB,the TRC404 jetton balance of userA will decrease one,the TRC404 jetton balance of userA will increase one.

The first project implemented TRC404 protocol: [TRC404 probably not found](https://github.com/NotFoundLabs/TRC-404)


# Specification


In order to fully compatible with existing Jetton and NFT standard.TRC404 standard contains four contracts: 
1.TRC404 Master(Compatible with jetton master standard contract)  
2.TRC404 Wallet(Compatible with jetton wallet standard contract)  
3.TRC404 NFT Collection(Compatible with nft collection standard contract)  
2.TRC404 NFT Item(Compatible with nft item standard contract)  


## Jetton master contract
### Get-methods
Must implement `get_jetton_data()` and `get_wallet_address(slice owner_address)` as Jetton standard described.

## TRC404 wallet smart contract
For contract data storage, the content of the following three attributes must be saved:

`nft_collection_address` - address of the TRC404 NFT Collection contract address.
`owned_nft_dict` - dictionary of the TRC404 NFT owned by user.
`owned_nft_number` -  number of NFTs owned by user.

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

`amount` - amount of transferred TRC404 jettons in elementary units.

`destination` - address of the new owner of the TRC404 jettons.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.

`custom_payload` - optional custom data (which is used by either sender or receiver TRC404 jetton wallet for inner logic).

`forward_ton_amount` - the amount of nanotons to be sent to the destination address.

`forward_payload` - optional custom data that should be sent to the destination address.

**Should be rejected if:**

1. message is not from the owner.
2. there is no enough TRC404 jettons on the sender wallet
3. there is no enough TON (with respect to jetton own storage fee guidelines and operation costs) to process operation, deploy receiver's jetton-wallet and send `forward_ton_amount`.

**Otherwise, should do:**

1. Decrease TRC404 jetton amount on sender wallet by `amount` and Send `internal_transfer` to receiver TRC404 wallet (and optionally deploy it). About the TL-B schema of `internal_transfer` message,please reference the Jetton standard. 
2. Calculate the number of nft that needs to be burned. If the number is more than zero, delete and select n(n>=1) nft item index(Might be the smallest,biggest one,etc.) from  `owned_nft_dict` ,then send n `reduce_one_nft` messages  to `nft_collection_address` .

  

#### 2. `internal_transfer`
**Request**

TL-B schema of inbound message:

```
internal_transfer#0x178d4519 query_id:uint64 amount:(VarUInteger 16) from:MsgAddress
                     response_address:MsgAddress
                     forward_ton_amount:(VarUInteger 16)
                     forward_payload:(Either Cell ^Cell)
                     = InternalMsgBody;
```

`query_id` - arbitrary request number.

`amount` - amount of received TRC404 jettons in elementary units.

`from` - owner address of the sender's TRC404 wallet contract.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message Toncoins.

`forward_ton_amount` - the amount of nanotons to be sent to the destination address.

`forward_payload` - optional custom data that should be sent to the destination address.

**Should be rejected if:**

1. message is not from the TRC404 wallet contract.

**Otherwise, should do:**

1. Increase TRC404 jetton amount on receiver TRC404 wallet by `amount` .
2. Calculate the number of nft that needs to be minted.If the number is more than zero, send n `add_nft_supply` messages  to `nft_collection_address`.


### Get-methods
Must implement `get_wallet_data()`  as Jetton standard described.


## TRC404 nft collection smart contract
For contract data storage, the content of the following three attributes must be saved:

`total_supply` - total supply of TRC404 NFT
`trc404_wallet_code` - trc404 wallet code
`trc404_master_address` -  trc404 master contract address
`owned_nft_limit` -  the max number of NFTs owned by user

Must implement:

### Internal message handlers

#### 1. `add_nft_supply`
**Request**
  

TL-B schema of inbound message:

```
add_nft_supply#71d2a5a3 query_id:uint64 item_index:uint64 
                     owner_address_of_sender_trc404_wallet:MsgAddress
                     esponse_destination:MsgAddress
                     = InternalMsgBody;
```


   `query_id` -  should be equal with request's `query_id`

   `current_nft_balance` - should be equal with the current nft number owned by user.

   `new_nft_number` - should be equals with the number of nft that needs to be minted.

   `owner_address_of_sender_trc404_wallet` - should be equal with owner address of this TRC404 wallet contract

   `response_destination` - address where to send the rest of the incoming message Toncoins.

**Should be rejected if:**

1. message is not from the TRC404 wallet contract.

**Otherwise, should do:**

1. According the `owned_nft_limit`,calculate the correct the nft number need to be minted. 
   If `current_nft_balance` >= `owned_nft_limit`,`correct_new_nft_number` = 0  
   If `current_nft_balance` < `owned_nft_limit`,`correct_new_nft_number` = `owned_nft_limit` - `current_nft_balance`
   `correct_nft_number`
2. Increase `total_supply`  on TRC404 nft collection contract by `correct_new_nft_number` .
3. Send n  message to init and deploy n nft item contracts.
4. Send notify message to receiver's TRC404 wallet to update `owned_nft_dict` and `owned_nft_number`.



#### 2. `reduce_one_nft`
**Request**
  
TL-B schema of inbound message:

```
reduce_one_nft#40d7c55d query_id:uint64 item_index:uint64 
                     owner_address_of_sender_trc404_wallet:MsgAddress
                     esponse_destination:MsgAddress
                     = InternalMsgBody;
```


   `query_id` -  should be equal with request's `query_id`

   `item_index` - should be equal with nft item index that needs to be burned. 

   `owner_address_of_sender_trc404_wallet` - should be equal with owner address of this TRC404 wallet contract

   `response_destination` - address where to send the rest of the incoming message Toncoins.

**Should be rejected if:**

1. message is not from the TRC404 wallet contract.

**Otherwise, should do:**

1. Decrease `total_supply`  on TRC404 nft collection contract by one .
2. Send  message to nft item contract to burn this contract.


#### 3. `request_transfer_one_ft_and_nft`
**Request**
  
TL-B schema of inbound message:

```
request_transfer_one_ft_and_nft#4476fc05 query_id:uint64 item_index:uint64 
                     from:MsgAddress
                     to:MsgAddress
                     response_destination:MsgAddress
                     = InternalMsgBody;
```


   `query_id` -  should be equal with request's `query_id`

   `item_index` - should be the nft item index that needs to be transferred. 

   `from` - should be equal with sender client wallet address

   `to` - should be equal with receiver client wallet address

   `response_destination` - address where to send the rest of the incoming message Toncoins.

**Should be rejected if:**

1. message is not from the nft item contract.

**Otherwise, should do:**

1. Send  message to sender's TRC404 wallet to decrease `owned_nft_number` by one and delete the nft_item_index from `owned_nft_dict`.
2. Send  message to receiver's TRC404 wallet to increase `owned_nft_number` by one and add the nft_item_index into  `owned_nft_dict`.


### Get-methods
Must implement `get_collection_data()`,`get_nft_address_by_index(int index)` and `get_nft_content(int index, cell individual_content)`  as NFT standard described.


## TRC404 nft item smart contract

For contract data storage, the content of the following three attributes must be saved:

`nft_item_index` - nft item index
`nft_collection_address` -  trc404 nft collection contract address


Must implement:

### Internal message handlers
### 1. `transfer`
**Request**

TL-B schema of inbound message:

`transfer#5fcc3d14 query_id:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell) forward_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell) = InternalMsgBody;`

`query_id` - arbitrary request number.

`new_owner` - address of the new owner of the NFT item.

`response_destination` - address where to send a response with confirmation of a successful transfer and the rest of the incoming message coins.

`custom_payload` - optional custom data.

`forward_amount` - the amount of nanotons to be sent to the new owner.

`forward_payload` - optional custom data that should be sent to the new owner.

**Should be rejected if:**

1. message is not from current owner.
2. there is no enough coins (with respect to NFT own storage fee guidelines) to process operation and send `forward_amount`.
3. After processing the request, the contract **must** send at least `in_msg_value - forward_amount - max_tx_gas_price` to the `response_destination` address.
   If the contract cannot guarantee this, it must immediately stop executing the request and throw error.
   `max_tx_gas_price` is the price in Toncoins of maximum transaction gas limit of NFT habitat workchain. For the basechain it can be obtained from [`ConfigParam 21`](https://github.com/ton-blockchain/ton/blob/78e72d3ef8f31706f30debaf97b0d9a2dfa35475/crypto/block/block.tlb#L660) from `gas_limit` field.

**Otherwise, should do:**

1. change current owner of NFT to `new_owner` address.
2. if `forward_amount > 0` send message to `new_owner` address with `forward_amount` nanotons attached and with the following layout:
   TL-B schema: `ownership_assigned#05138d91 query_id:uint64 prev_owner:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.
   `forward_payload` should be equal with request's `forward_payload`.
   `prev_owner` is address of the previous owner of this NFT item.
   If `forward_amount` is equal to zero, notification message should not be sent.
3. Send `request_transfer_one_ft_and_one_nft` message to `nft_collection_address` . (Notice: This is the difference from the nft item standard)  
4. Send all excesses of incoming message coins to `response_destination` with the following layout:
   TL-B schema: `excesses#d53276db query_id:uint64 = InternalMsgBody;`
   `query_id` should be equal with request's `query_id`.


### Get-methods
Must implement `get_nft_data()`  as NFT standard described.

## TL-B Schema
Notice: In order to fully compatible with existing Jetton and NFT standard.
The TL-B schema of TRC404 jetton `transfer` and `internal_transfer` are the same with existing Jetton standard.
The TL-B schema of TRC404 NFT `transfer` and `ownership_assigned` are the same with existing NFT standard.
Here we only list the TL-B schemas that are not exist in both the Jetton and NFT standards.


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

add_nft_supply#71d2a5a3 query_id:uint64 item_index:uint64 
                     owner_address_of_sender_trc404_wallet:MsgAddress
                     esponse_destination:MsgAddress
                     = InternalMsgBody;

reduce_one_nft#40d7c55d query_id:uint64 item_index:uint64 
                     owner_address_of_sender_trc404_wallet:MsgAddress
                     esponse_destination:MsgAddress
                     = InternalMsgBody;


request_transfer_one_ft_and_nft#4476fc05 query_id:uint64 item_index:uint64 
                     from:MsgAddress
                     to:MsgAddress
                     response_destination:MsgAddress
                     = InternalMsgBody;


```

Tags were calculated via tlbc as follows (request_flag is equal to `0x7fffffff` and response flag is equal to `0x80000000`):

`crc32('add_nft_supply query_id:uint64 current_nft_balance:uint64 new_nft_number:uint64 owner_address_of_sender_trc404_wallet:MsgAddress response_destination:MsgAddress = InternalMsgBody') = 0xf1d2a5a3 & 0x7fffffff = 0x71d2a5a3`

`crc32('educe_one_nft query_id:uint64 item_index:uint64 owner_address_of_sender_trc404_wallet:MsgAddress response_destination:MsgAddress = InternalMsgBody') = 0xc0d7c55d & 0x7fffffff = 0x40d7c55d`

`crc32('reduce_one_nft query_id:uint64 item_index:uint64 from:MsgAddress to:MsgAddress  response_destination:MsgAddress = InternalMsgBody') = 0xc476fc05 & 0x7fffffff = 0x4476fc05`




# Drawbacks
Because TRC404 protocol might burn NFTs and mint NFTs when user transfer TRC404 jetton,the gas fee will higher than common Jetton transfer and NFT transfer.


# Rationale and alternatives

## Why do we need to set owned_nft_number in nft collection contract?
As mentioned in the drawbacks,if we don't set the owned_nft_number, it will cost an extremely high gas fee when we transfer a large number TRC404 jetton.After we set the owned_nft_number,let's say 5, the gas fee will not be more than 0.5 Ton no matter how much TRC404 jetton you transfer.

# Prior art
1. [Ethereum ERC404 Protocol implementation](https://github.com/Pandora-Labs-Org/erc404)

# Unresolved questions

None

# Future possibilities

1. TRC404 NFT wrap service(Make non TRC404 NFT support TRC404 protocol)
2. TRC404 NFT swap platform(let different NFT(like game NFT,etc.) can easily swap each other)

