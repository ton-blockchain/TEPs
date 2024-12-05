- **TEP**: [85](https://github.com/ton-blockchain/TEPs/pull/85)
- **title**: SBT Contract
- **status**: Active
- **type**: Contract Interface
- **authors**: [Oleg Baranov](https://github.com/xssnick), [Narek Abovyan](https://github.com/Naltox), [Kirill Emelyanenko](https://github.com/EmelyanenkoK), [Oleg Andreev](https://github.com/oleganza)
- **created**: 09.08.2022
- **replaces**: -
- **replaced by**: -

# Summary

Soul bound token (SBT) is a special kind of NFT which can not be transferred. It includes optional certificate mechanics with revoke by authority and onchain ownership proofs. Holder can destroy his SBT in any time.

# Motivation

There is a useful type of token which allows to give social permissions/roles or certificates to some users. For example, it can be used by marketplaces to give discounts to owners of SBT, or by universities to give attestation certificates in SBT form. Mechanics with ownership proof allows to easily prove to any contract that you are an owner of some SBT.

# Specification

SBT implements [NFT standard interface](https://github.com/ton-blockchain/TIPs/issues/62) but `transfer` should always be rejected.

#### 1. `prove_ownership`

TL-B schema of inbound message:
```
prove_ownership#04ded148 query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
`query_id` -  arbitrary request number.

`dest` -  address of the contract to which the ownership of SBT should be proven.

`forward_payload` - arbitrary data required by target contract.

`with_content` - if true, SBT's content cell will be included in message to contract.

**Should be rejected if:**
* Sender address is not the owner's address.

**Otherwise should do:**
Send message with TL-B schema to `dest` contract:
```
ownership_proof#0524c7ae query_id:uint64 item_id:uint256 owner:MsgAddress 
data:^Cell revoked_at:uint64 content:(Maybe ^Cell) = InternalMsgBody;
```

`query_id` - request number passed in `prove_ownership`.

`item_id` -  id of NFT.

`owner` - current owner's address.

`data` - data cell passed in `prove_ownership`.

`revoked_at` - unix time when SBT was revoked, 0 if it was not.

`content` - NFT's content, it is passed if `with_content` was true in `prove_ownership`.

#### 2. `request_owner`

TL-B schema of inbound message:
```
request_owner#d0c3bfea query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
`query_id` -  arbitrary request number.

`dest` -  address of the contract to which the ownership of SBT should be proven.

`forward_payload` - arbitrary data required by target contract.

`with_content` - if true, SBT's content cell will be included in message to contract.

**Should do:**

Send message with TL-B schema to `dest` contract:
```
owner_info#0dd607e3 query_id:uint64 item_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell revoked_at:uint64 content:(Maybe ^Cell) = InternalMsgBody;
```

`query_id` - request number passed in `prove_ownership`.

`item_id` -  id of NFT.

`initiator` - address of request initiator.

`owner` - current owner's address.

`data` - data cell passed in `prove_ownership`.

`revoked_at` - unix time when SBT was revoked, 0 if it was not.

`content` - SBT's content, it is passed if `with_content` was true in `request_owner`.

#### 3. `destroy`

TL-B schema of an internal message:
```
destroy#1f04537a query_id:uint64 = InternalMsgBody;
```
`query_id` -  arbitrary request number.

Should be rejected if:
* Sender address is not an owner's address.

Otherwise should do:
 * Set owner's address and authority to null.
 * Send message to sender with schema `excesses#d53276db query_id:uint64 = InternalMsgBody;` that will pass contract's balance amount.

#### 4. `revoke`

TL-B schema of inbound message:
```
revoke#6f89f5e3 query_id:uint64 = InternalMsgBody;
```
`query_id` -  arbitrary request number.

**Should be rejected if:**
* Sender address is not an authority's address.
* Was already revoked

**Otherwise should do:**
Set revoked_at to current unix time.

**GET methods**
1. `get_nft_data()` - same as in [NFT standard](https://github.com/ton-blockchain/TIPs/issues/62).
2. `get_authority_address()` - returns `slice`, that is authority's address. Authority can revoke SBT. 
**This method is mandatory for SBT, if there is no authority it should return addr_none (2 zero bits)**
3. `get_revoked_time()` - returns `int`, that is unix time of when it was revoked. It is 0 when not revoked.

### Implementation example
https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc

# Guide

#### Minting
It can be done using basic NFT collection, SBT should be an item. In mint message additionally authority address should be passed, [after content](https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc#L90). 

Before mint, issuer is recommended to check the wallet code and confirm that it is standartized wallet and not some transferrable contract that can be sold to 3rd parties.

#### Proving you ownership to contracts
SBT contracts has a feature that let you implement interesting mechanics with contracts by proving ownership onchain. 

You can send message to SBT, and it will proxify message to target contract with its index, owner's address and initiator address in body, together with any useful for contract payload, 
this way target contract could know that you are owner of SBT which relates to expected collection. Contract could know that SBT relates to collection by calculating address of SBT using code and index, and comparing it with sender.

There are 2 methods which allow to use this functionality, **ownership proof** and **ownership info**. 
The difference is that proof can be called only by SBT owner, so it is preferred to use when you need to accept messages only from owner, for example votes in DAO.

##### Ownership proof
**SBT owner** can send message to SBT with this schema:
```
prove_ownership#04ded148 query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
After that SBT will send transfer to `dest` with scheme:
```
ownership_proof#0524c7ae query_id:uint64 item_id:uint256 owner:MsgAddress 
data:^Cell revoked_at:uint64 content:(Maybe ^Cell)
```

##### Ownership info
**anyone** can send message to SBT with this schema:
```
request_owner#d0c3bfea query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
After that SBT will send transfer to `dest` with scheme:
```
owner_info#0dd607e3 query_id:uint64 item_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell revoked_at:uint64 content:(Maybe ^Cell)
```

#### Verify SBT contract example

```C
int op::ownership_proof() asm "0x0524c7ae PUSHINT";

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

  if (op == op::ownership_proof()) {
    int id = in_msg~load_uint(256);

    (slice collection_addr, cell sbt_code) = load_data();
    throw_unless(403, equal_slices(sender_address, collection_addr.calculate_sbt_address(sbt_code, 0, id)));

    slice owner_addr = in_msg~load_msg_addr();
    cell payload = in_msg~load_ref();
    
    int revoked_at = in_msg~load_uint(64);
    throw_if(403, revoked_at > 0);
    
    int with_content = in_msg~load_uint(1);
    if (with_content != 0) {
        cell sbt_content = in_msg~load_ref();
    }
    
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

This design allows us to use SBT as certificates, with revoke and onchain proofs, and in the same time allows to make true SBT if authority in not set.

- **What other designs have been considered and what is the rationale for not choosing them?**

Initially, the design similar to ETH with address-bounded tokens was considered, but it was extended with usefull onchain proofs and revoke option.

- **What is the impact of not doing this?**

Currently, TON have no owner-bounded token standard, so it is a problem to issue tokens that cannot be transferred to 3rd parties. So, if we ignore this or any similar standard that introduces such mechanics, TON could miss some interesting and perspective products.

# Prior art

In ETH ([EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973)) - SBT was done as an NFT which could not be transferred between accounts at all. We did tha same but extended the logic with onchain proofs, and added authority which can revoke, so SBT can be used as fully functional certificate.
# Drawbacks

[EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973) has equip/unequip mechanics which allows to show/hide SBT temporarily. In current proposal we can only destroy SBT. Actually not sure that show/hide logic is needed for us. 

# Future possibilities

Standard looks finalized.
