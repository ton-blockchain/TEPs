- **TEP**: [88](https://github.com/ton-blockchain/TEPs/pull/87)
- **title**: TVM update
- **status**: Draft
- **type**: Core
- **authors**: [@SpyCheese](https://github.com/SpyCheese) [@EmelyanenkoK](https://github.com/EmelyanenkoK) 
- **created**: 07.07.2022
- **replaces**: -
- **replaced by**: -

# Summary

This proposal suggests to
- add new op-codes to TVM related to block data retrieving, hashing, cryptographic signing and message sending
- include into `c7` register of TVM smart-contract' own code, additional data on transaction and information about masterchain blocks
 
# Motivation

Current TVM implementation makes it hard to implement some common thing. Proposal aims to make it easier and cheaper to:
- hash big chanks of data (including non-sha256 hashes)
- work with Bitcoin/Ethereum compatible signtatures
- prove TON onchain data
- calculate fee for sending messages

# Guide

Draft implementation is available [here](https://github.com/SpyCheese/ton/commits/new-opcodes).

This proposal suggests to 
1. Extend **c7** tuple from 10 to 14 elements:
   - **10**: code of the smart contract.
   - **11**: value of the incoming message.
   - **12**: fees collected in the storage phase.
   - **13**: information about previous blocks.
2. Add the following TVM op-codes:
   - **c7** primitives: `MYCODE`, `INCOMINGVALUE`, `STORAGEFEES`, `PREVBLOCKSINFOTUPLE`
   - Block primitives: `PREVMCBLOCKS`, `PREVKEYBLOCK`
   - Hash primitives: `HASHSTART`, `HASHEND`, `HASHENDST`, `HASHINFO`, `HASHAPPU`, `HASHAPPI`, `HASHAPPS`, `HASHAPPB`
   - Cryptography primitives: `ECRECOVER`
   - Message primitives: `SENDMSG`

3. Change sending fee calculation: deduct fee related to message estimation even in the case of failed sending.

# Specification

## c7 update
**10th** element of **c7** tuple contains cell with executed smart-contract code (from init_state of incoming message if applicable)

**11th** element of **c7** tuple contains value of incoming message. It is a tuple with two elements: incoming value (same value which is put on stack as 4th element) and a dictionary of extra currencies. If not applicable, the value is `[0, null]`.

**12th** element of **c7** tuple contains fee debited in storage phase.

**13th** elements of **c7** contains of tuple with two elements: `last_mc_blocks` and `prev_key_block`.
- `last_mc_blocks` is a tuple of up to 16 elements which contains previous most recent masterchain blocks info (ordered by seqno). Each block is represented as tuple of 5 integers: `(workchain, shard, seqno, root_hash, file_hash)`
- `prev_key_block` is a tuple of 5 integers `(workchain, shard, seqno, root_hash, file_hash)` corresponding to most recent key block.

## TVM update
### New stack type
This proposal suggests to introduce new type in TVM `Hasher`: it is opaque type used to consequently hash data chunks. This type behave the same way as others and can be considered immutable: `HASHAPP*` ops (described below) "consume" old hasher and return updated one (that way if old hasher was copied, it's copies are completely independent). This object is not serializable and thus can not be returned from TVM (for instance as result of get-method).
### New opcodes
#### c7 and block ops
`MYCODE` - `0xF82A` - ` - c` - return cell with currently executed code. Equivalent to `10 GETPARAM`.

`INCOMINGVALUE` - `0xF82B` - ` - i` - return integer with TON amount in incoming message (or zero if not applicable). Equivalent to `11 GETPARAM`.

`STORAGEFEES` - `0xF82C` - ` - i` - return integer value of fee in nanoTONs debited in storage phase. Equivalent to `12 GETPARAM`.

`PREVBLOCKSINFOTUPLE` - `0xF82D` - ` - t` - return tuple with previous blocks info. Equivalent to `13 GETPARAM`.

`PREVMCBLOCKS`- `0xF83400` - ` - t` - return tuple with previous masterchain blocks info. Equivalent to `13 GETPARAM; FIRST`

`PREVKEYBLOCK`- `0xF83401` - ` - t` - return tuple with previous keyblock id. Equivalent to `13 GETPARAM; SECOND`

#### Hash primitives
`HASHSTART_SHA256` - `0xF90300` - ` - h` - create `sha256` hasher object.

`HASHSTART_SHA512` - `0xF90301` - ` - h` - create `sha512` hasher object.

`HASHSTART_BLAKE2B` - `0xF90302` - ` - h` - create `blake2b` hasher object.

`HASHSTART_KECCAK256` - `0xF90303` - ` - h` - create `keccak256` hasher object.

`HASHSTART_KECCAK512` - `0xF90304` - ` - h` - create `keccak512` hasher object.


`HASHEND` - `0xF904` - `h - ... ` - calculate hash from hasher and put in on the stack. If size of the hash does not exceed 256 bits, it is returned as a 256-bit unsigned integer (e.g. sha256). Otherwise it is returned as a tuple of 256-bit integers (e.g. sha512 - tuple of two integers). If the bit length of data in hasher is not divisible by eight, throws a cell underflow exception.

`HASHENDST` - `0xF905` - `b h - b' ` - calculate hash from hasher and store it into the slice.


`HASHINFO` - `0xF906` - `h - i` - return hash type of hasher (`sha256` - `0`, `sha512` - `1`, `blake2b` - `2`, `keccak256` - `3`, `keccak512` - `4`).


`HASHAPPU` - `0xF907xx` - `h i - h'` - serialize unsigned integer in `xx+1` number of bits and put it into hasher.

`HASHAPPI` - `0xF907xx` - `h i - h'` - serialize signed integer in `xx+1` number of bits and put it into hasher.

`HASHAPPS` - `0xF909` - `h s - h'` - put data bits from slice to hasher.

`HASHAPPB` - `0xF909` - `h b - h'` - put data bits from builder to hasher.

#### Cryptography primitives

`ECRECOVER` - `0xF912` - `m v r s - i i i -1 or 0` - get secp256k1 signature as three integers `v`(8 bit), `r`(256 bit) and `s`(256 bit) and signed message hash `m` as 256 bit integer, decrypts the public key using elliptic curve DSA recovery mechanism and returns pubkey curve point (header-byte integer and two 256-bit integers for coordinates) and `-1` if signature is valid and `0` if not.

#### Message primitives
`SENDMSG` - `0xFB08` - `c m - i` - Sends a raw message contained in Cell `c` with mode `m` (the same way as `SENDRAWMSG`) and returns approximate action fee. The difference in mode interpreation with `SENDRAWMSG` is as following: `+1024` is used to calculate fee only (doesn't create output action), `+64` uses whole value of incoming value (since exact value can not be determined until the end of Computation phase), `+128` uses whole balance of account (since exact value can not be determined until the end of Computation phase).

### Change in message fee
It is suggested to deduct fee related to calculation of `fwd_fee` (cell graph traversal) in the case unsuccessfull sending. The fine of visiting cell in message that is not sent is proposed to be 1/4 of msg\_cell\_price.

## Update activation
It is expected that update will be activated as soon as at least 2/3 of validators will update and vote for version greater or equal to `4` in `GlobalVersion`: `ConfigParam 8`.

# Drawbacks

Downsides of this update is
- compication of TVM
- introducing of non-serializable TVM type

# Rationale and alternatives

Generally hash, cryptography and message primitives can be implemented without introducing of new opcodes. However it will be much more expensive and resource-intensive. In other words the same operation will needlessly require much more computation. Cheap and ready-to-go hash and cryptography operations will simplify cross-chain interactions with other networks.

Having contract code in c7 will eliminate necessity to store contract code explicitly in storage.

Having incoming message value in c7 will eliminate necessity to pass value from the stack (or manually save it into registers).

Having block info in c7 will allow to prove onchain data: for instance it is possible to prove existence of some transaction or account state or even get-method result at some point of time via merkle-proofs.

Fee deduction for unsent message eliminates unpaid work of message forward fee calculation.

# Prior art

Contract code was put into the same tuple index as in Everscale; while networks are not fully compatible (and compatibility is not pursued) some applications may still work in both.

# Unresolved questions

-

# Future possibilities

-
