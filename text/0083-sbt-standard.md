- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: SBT Contract
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Oleg Baranov](https://github.com/xssnick), [Narek Abovyan](https://github.com/Naltox), [Kirill Emelyanenko](https://github.com/EmelyanenkoK), [Oleg Andreev](https://github.com/oleganza)
- **created**: 09.08.2022

# Summary

Soul bound token (SBT) is a special kind of NFT which can be transferred only between its owner's accounts and only by authority. For this, it stores immutable authority address, and authority is needed to send NFT transfer message to change owner's address, but in the same time owner is always able to destroy SBT.

# Motivation

There is a useful type of token which allows to give social permissions/roles or certificates to some users. For example, it can be used by marketplaces to give discounts to owners of SBT, or by universities to give attestation certificates in SBT form. Authority can revoke SBT in any time by it's will. For example in case of breaking some rules. Authority also could be null, then SBT is unmovable and cannot be revoked.

# Specification
SBT implements [NFT standard interface](https://github.com/ton-blockchain/TIPs/issues/62) with two modifications:

* method `transfer` is only available to the `authority`, not the `owner`,
* SBT adds method `destroy` that allows the `owner` to burn their SBT.

You should consider implementing [NFT Ownership Proof interface](https://github.com/ton-blockchain/TEPs/blob/194709d699805186127f55ae089911b3aca79284/text/0095-prove-ownership.md) to allow SBT owners authenticate their actions within other smart contracts on TON blockchain.


### internal `transfer`

TL-B schema of inbound message:

```
transfer#5fcc3d14 query_id:uint64
                  new_owner:MsgAddress
                  response_destination:MsgAddress
                  custom_payload:(Maybe ^Cell)
                  forward_amount:(VarUInteger 16)
                  forward_payload:(Either Cell ^Cell) 
                  = InternalMsgBody;
```

The transfer method MUST check if the sender address is equal to the `authority` address.

Otherwise the semantics of the method are identical to that of [NFT](https://github.com/ton-blockchain/TIPs/issues/62)


### internal `destroy`

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

### `get_nft_data()`

Same as in [NFT standard](https://github.com/ton-blockchain/TIPs/issues/62).

### `get_authority_address()`

Returns `slice` containing the address of authority. Authority is able to revoke SBT.


### Reference implementation

[sbt-item.fc](https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc)


# Guide

#### Minting
It can be done using basic NFT collection, SBT should be an item. In mint message additionally authority address should be passed, [after content](https://github.com/getgems-io/nft-contracts/blob/main/packages/contracts/sources/sbt-item.fc#L137).

Before mint, issuer is recommended to check the wallet code and confirm that it is standartized wallet and not some transferrable contract that can be sold to 3rd parties.

#### Changing owner's address

Authority should send transfer to SBT address and SBT will be reassigned to the new owner's address.

# Rationale and alternatives

- **Why is this design the best in the space of possible designs?**

This design allows us to transfer SBT between owner's wallets and at the same time it restricts transfers to 3rd parties, because of authority transfer mechanics. To reattach SBT to new address, authority should send NFT transfer message with new owner's address.

- **What other designs have been considered and what is the rationale for not choosing them?**

Initially, the design similar to ETH with address-bounded tokens was considered, but because of difference in TON architecture, especially wallet versions, design was reworked. In our standard we added authorities which can move and revoke SBT, this way those tokens becomes more usefull for community cases.

- **What is the impact of not doing this?**

Currently, TON have no owner-bounded token standard, so it is a problem to issue tokens that cannot be transferred to 3rd parties. So, if we ignore this or any similar standard that introduces such mechanics, TON could miss some interesting and perspective products.

# Prior art

In ETH ([EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973)) - SBT was done as an NFT which could not be transferred between accounts at all, but in TON - architecture is different, and sometimes it is required to update wallet version. This action will also change wallet address but owner will remain the same. Thus, SBT owner can ask authority to transfer his SBT to new wallet, for example with proving identity.

# Drawbacks

[EIP-4973 ABT](https://eips.ethereum.org/EIPS/eip-4973) has equip/unequip mechanics which allows to show/hide SBT temporarily. In current proposal we can only destroy SBT. Actually not sure that show/hide logic is needed for us, since owner can ask authority to move SBT to his diff address or even burn SBT himself. 

# Future possibilities

Standard looks finalized.

