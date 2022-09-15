**TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: NFT Ownership proof
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Oleg Baranov](https://github.com/xssnick), [Narek Abovyan](https://github.com/Naltox), [Kirill Emelyanenko](https://github.com/EmelyanenkoK), [Oleg Andreev](https://github.com/oleganza)
- **created**: 15.09.2022

# Summary

Ownership proofs is NFT standard extension which gives ability to send proof of NFT ownership to any contracts, those contracts will be able to verify it and implement some scalable authorization logic.

# Motivation

Currently we have no standard which gives ability to prove to some contract your ownership of NFT. 
It is usually done by transferring NFT to contract and contract transfers NFT back to you, but it is not safe.

This standard introduces some new mehanics which allows to prove your NFT ownership to any contract without transferring it. 
There are 2 methods which allow to use this functionality, **ownership proof** and **ownership signal**. 
The difference is that **ownership signal** can be called only by NFT owner, so it is preferred to use when you need to accept messages only from owner, for example votes in DAO.
And **ownership proof** can be called by anyone to send message to contract to inform it about NFT owner and request initiator, for example it could be contract itself. 

# Specification

### Implementation example
https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc

# Guide

#### Proving ownership to contracts
You can send message to NFT and it will proxify message to target contract with its index and owner's wallet address in payload. 
This way, target contract could know that you are owner of NFT that relates to expected collection. 
Contract could know that NFT relates to collection by calculating address of NFT using code and index, and comparing it with sender.

There are 2 methods which allow to use this functionality, **ownership proof** and **ownership signal**. 
The difference is that signal can be called only by NFT owner, so it is preferred to use when you need to accept messages only from owner, for example votes in DAO.

##### Ownership signal
**NFT owner** can send message to NFT with this schema:
```
signal_ownership#7d72ae8c query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
After that NFT will send transfer to `dest` with scheme:
```
ownership_signal#74f8d5f5 query_id:uint64 item_id:uint256 owner:MsgAddress 
data:^Cell content:(Maybe ^Cell)
```
If something goes wrong and target contract not accepts message, and it will be bounced back to NFT, NFT will proxy this bounce to **owner**, this way coins will not stuck on NFT.
Schema of message that will be send back to owner:
```
ownership_signal_bounced#adfd3d4b query_id:uint64 item_id:uint256 owner:MsgAddress 
data:^Cell content:(Maybe ^Cell)
```

##### Ownership proof
**anyone** can send message to NFT with this schema:
```
request_ownership_proof#87046795 query_id:uint64 dest:MsgAddress 
forward_payload:^Cell with_content:Bool = InternalMsgBody;
```
After that NFT will send transfer to `dest` with scheme:
```
ownership_proof#9c3013fd query_id:uint64 item_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell content:(Maybe ^Cell)
```
If something goes wrong and target contract not accepts message, and it will be bounced back to NFT, NFT will proxy this bounce to **initiator**.
Schema of message that will be send back to initiator:
```
ownership_proof_bounced#fe719b2c query_id:uint64 item_id:uint256 initiator:MsgAddress owner:MsgAddress 
data:^Cell content:(Maybe ^Cell)
```
#### Verify NFT contract example

```C
int op::ownership_signal() asm "0x74f8d5f5 PUSHINT";

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

  if (op == op::ownership_signal()) {
    int id = in_msg~load_uint(256);

    (slice collection_addr, cell sbt_code) = load_data();
    throw_unless(403, equal_slices(sender_address, collection_addr.calculate_sbt_address(sbt_code, 0, id)));

    slice owner_addr = in_msg~load_msg_addr();
    cell payload = in_msg~load_ref();

    int with_content = in_msg~load_uint(1);
    if (with_content != 0) {
        cell sbt_content = in_msg~load_ref();
    }

    ;;
    ;; nft verified, do something
    ;;

    return ();
  }

  throw(0xffff);
}
```

# Rationale and alternatives

- **Why is this design the best in the space of possible designs?**

This design allows us to safely send proof to contracts in 2 ways, **signal** can be used only by owner, and can be applied to DAO. 
And **proof** can be used by contracts or other chain members, for example to reverse-verify owner.

- **What other designs have been considered and what is the rationale for not choosing them?**

There are no alternatives of such logic in other blockchains I found, usually it is done by reading from NFT state, but in TON we cannot do it.

- **What is the impact of not doing this?**

We will miss the standard of onchain nft proofs, the only standartized way is transfer, but it is not safe.

# Prior art

In ETH, contracts can read nft owner directly from nft. In TON we dont have such feature, so we need to do it another way. After some discussions current approach was considered as the best. 

# Drawbacks

This is optional standard extension, so it

# Future possibilities

This standard looks finalized and not require future additions.
