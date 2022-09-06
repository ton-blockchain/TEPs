- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: SBT Contract
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Oleg Baranov](https://github.com/xssnick), [Narek Abovyan](https://github.com/Naltox), [Kirill Emelyanenko](https://github.com/EmelyanenkoK)
- **created**: 09.08.2022

# Summary

Soul bound token (SBT) is a special kind of NFT which can be transferred only between its owner's accounts. For this, it stores immutable public key of the owner, and it is needed to send transfer from new address with signature in payload to change owner's address.

# Motivation

There is a useful type of token which allows to give social permissions/roles or certificates to some users. For example, it can be used by marketplaces to give discounts to owners of SBT, or by universities to give attestation certificates in SBT form. Mechanics with ownership proof allows to easily prove to any contract that you are an owner of some SBT.

# Specification

SBT implements [NFT standard interface](https://github.com/ton-blockchain/TIPs/issues/62) but `transfer` should always be rejected, `pull_ownership` is used instead.

#### 1. `pull_ownership`

TL-B schema of inbound message:
```
pull_ownership#08496845 query_id:uint64 signature:^(bits 512) 
sbt_nonce:uint64 new_owner:MsgAddress response_destination:MsgAddress 
custom_payload:(Maybe ^Cell) = InternalMsgBody;
```
`query_id` -  arbitrary request number.

`signature` - signature of the rest part of the message.

`sbt_nonce` - nonce, required for protection of signature replay attacks.

`new_owner` - address of the new owner of the SBT item, should be the same as sender's address.

`response_destination` - address where a response with confirmation of a successful pull and the rest of the incoming message coins should be sent.

`custom_payload` - optional custom data.

**Should be rejected if:**
1. `signature` verification failed.
2. `sbt_nonce` not equals stored nonce.
3. `new_owner` is not sender's address.
4. there is not enough coins (with respect to NFT own storage fee guidelines).
5. After processing the request, the contract must send at least in_msg_value - forward_amount - max_tx_gas_price to the response_destination address. If the contract cannot guarantee this, it must immediately stop executing the request and throw the error.

**Otherwise should do:**
1. Change current owner of SBT to `new_owner` address.
2. Generate and store new random `nonce`.
3. Send all excesses of incoming message coins to response_destination with the following layout:
   
   `excesses#d53276db query_id:uint64 = InternalMsgBody;`

   query_id should be equal with request's `query_id`.

#### 2. `prove_ownership`

TL-B schema of inbound message:
```
prove_ownership#04ded148 query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
`query_id` -  arbitrary request number.

`dest` -  address of the contract to which the ownership of SBT should be proven.

`data` - arbitrary data required by target contract.

`with_content` - if true, SBT's content cell will be included in message to contract.

**Should do:**

Send message with TL-B schema to `dest` contract:
```
verify_ownership#1eac6b5d query_id:uint64 sbt_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell content:(Maybe ^Cell) = InternalMsgBody;
```

`query_id` - request number passed in `prove_ownership`.

`sbt_id` -  id of SBT.

`initiator` - `prove_ownersip` initiator's address.

`owner` - current owner's address.

`data` - data cell passed in `prove_ownership`.

`content` - SBT's content, it is passed if `with_content` was true in `prove_ownership`.

In case when `verify_ownership` was bounced back to SBT, SBT should send message to initiator with schema:
```
verify_ownership_bounced#b645e081 query_id:uint64 sbt_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell content:(Maybe ^Cell) = InternalMsgBody;
```

#### 3. `destroy`

TL-B schema of inbound message:
```
destroy#1f04537a query_id:uint64 = InternalMsgBody;
```
`query_id` -  arbitrary request number.

**Should be rejected if:**
* Sender address is not an owner's address.
* Not enough balance to reserve 0.05 TON

**Otherwise should do:**
 * Set owner's address to null and set public key to 0.
 * Send message to sender with schema `excesses#d53276db query_id:uint64 = InternalMsgBody;` that will pass contract's balance amount over 0.05 TON

#### 4. `revoke`

TL-B schema of inbound message:
```
revoke#6f89f5e3 query_id:uint64 = InternalMsgBody;
```
`query_id` -  arbitrary request number.

**Should be rejected if:**
Sender address is not an authority's address.

**Otherwise should do:**
Set owner's address to null and set public key to 0.

**GET methods**
1. `get_public_key()` - returns `int`, that is owner's public key.
2. `get_nonce()` - returns `int`, which current nonce.
3. `get_nft_data()` - same as in [NFT standard](https://github.com/ton-blockchain/TIPs/issues/62).
4. `get_authority_address()` - returns `slice`, that is authority's address. Authority can revoke SBT.

### Implementation example
https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc

# Guide

#### Minting
It can be done using basic NFT collection, SBT should be an item. In mint message additionally uint256 owner's public key should be passed, [after content](https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc#L137). 

#### Changing owner's address
If you migrated to newer version of wallet and you want to move your SBT to it, you could send transfer to SBT from new wallet with payload:
```
pull_ownership#08496845 query_id:uint64 signature:^(bits 512) 
sbt_nonce:uint64 new_owner:MsgAddress response_destination:MsgAddress 
custom_payload:(Maybe ^Cell) = InternalMsgBody;
```
1. To do this, first you need to know current SBT's nonce, you can trigger `get_nonce` method of the SBT contract to get it.
2. `new_owner` should equals your wallet from which you sends message.
3. Then you need to sign `sbt_nonce:uint64 new_owner:MsgAddress response_destination:MsgAddress custom_payload:(Maybe ^Cell)` this part of the message and put signature as first reference.
4. Now you can send this message as internal to SBT and owner's address will be changed to your new wallet's address. 

It is also possible to destroy SBT by setting `new_owner` to null address. After that, owner's address cannot be changed anymore.

#### Proving you ownership to contracts
SBT contracts has a feature that let you implement interesting mechanics with contracts by proving ownership onchain. 

You can send message to SBT and it will proxify message to target contract with its index and your wallet address in header. 
This way, target contract could know that you are owner of SBT that relates to expected collection. Contract could know that SBT relates to collection by calculating address of SBT using code and index, and comparing it with sender.

To use this functionality, SBT owner's wallet can send transfer with this scheme to SBT:
```
prove_ownership#04ded148 query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
After that SBT will send transfer to `dest` with scheme:
```
verify_ownership#1eac6b5d query_id:uint64 sbt_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell content:(Maybe ^Cell) = InternalMsgBody;
```
If something goes wrong, target contract does not accept message and message will be bounced back to SBT. SBT will proxy this bounce to owner. This way, coins will not stuck on SBT.

#### Verify SBT contract example

```C
int op::verify_ownership() asm "0x1eac6b5d PUSHINT";

int equal_slices (slice a, slice b) asm "SDEQ";

_ load_data() {
    slice ds = get_data().begin_parse();

    return (
        ds~load_msg_addr(),    ;; collection_addr
        ds~load_ref()          ;; sbt_code
    );
}

slice calculate_sbt_address(slice collection_addr, cell sbt_item_code, int wc, int index) {
  cell data = begin_cell().store_uint(index, 64).store_slice(collection_addr).end_cell();
  cell state_init = begin_cell().store_uint(0, 2).store_dict(sbt_item_code).store_dict(data).store_uint(0, 1).end_cell();

  return begin_cell().store_uint(4, 3)
                     .store_int(wc, 8)
                     .store_uint(cell_hash(state_init), 256)
                     .end_cell()
                     .begin_parse();
}


() recv_internal(int balance, int msg_value, cell in_msg_full, slice in_msg) impure {
  slice cs = in_msg_full.begin_parse();
  int flags = cs~load_uint(4);

  slice sender_address = cs~load_msg_addr();

  int op = in_msg~load_uint(32);
  int query_id = in_msg~load_uint(64);

  if (op == op::verify_ownership()) {
    int id = in_msg~load_uint(256);

    (slice collection_addr, cell sbt_code) = load_data();
    throw_unless(403, equal_slices(sender_address, collection_addr.calculate_sbt_address(sbt_code, 0, id)));

    slice initiator_addr = in_msg~load_msg_addr();
    slice owner_addr = in_msg~load_msg_addr();
    
    ;; allow requests only initiated by SBT owner
    throw_unless(401, equal_slices(initiator_addr, owner_addr));

    cell payload = in_msg~load_ref();

    int with_content = in_msg~load_uint(1);
    if (with_content != 0) {
        cell sbt_content = in_msg~load_ref();
    }s

    ;;
    ;; sbt verified, do something
    ;;

    return ();
  }

  throw(0xffff);
}
```

# Rationale and alternatives

- **Why is this design the best in the space of possible designs?**

This design allows us to transfer SBT between owner's wallets and at the same time it restricts transfers to 3rd parties, because of `pull` mechanics. To attach SBT to address, we need to send message from this address to SBT with a signature, so you should be an owner of private key and address at the same time.

- **What other designs have been considered and what is the rationale for not choosing them?**

Initially, the design similar to ETH with address-bounded tokens was considered, but because of difference in TON architecture, especially wallet versions, design was reworked. After that, special **killer feature** with ownership proof to contract was added.

- **What is the impact of not doing this?**

Currently, TON have no owner-bounded token standard, so it is a problem to issue tokens that cannot be transferred to 3rd parties. So, if we ignore this or any similar standard that introduces such mechanics, TON could miss some interesting and perspective products.

# Prior art

In ETH ([EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973)) - SBT was done as an NFT which could not be transferred between accounts at all, but in TON - architecture is different, and sometimes it is required to update wallet version. This action will also change wallet address but owner will remain the same. Thus, pull ownership method was introduced to change owner's wallet address of SBT.

# Drawbacks

[EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973) has equip/unequip mechanics which allows to show/hide SBT temporarily. In current proposal we can only destroy SBT. Actually not sure that show/hide logic is needed for us, since owner can just move SBT to his diff address or even burn. 

# Future possibilities

Mechanics with ownership proof can also be added to NFT as a standard extension. It can be useful for many projects, because currently it's done using NFT transferring to contract, and it is not so safe.

