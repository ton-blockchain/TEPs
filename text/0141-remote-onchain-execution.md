- **TEP**: [141](https://github.com/ton-blockchain/TEPs/pull/141)
- **title**: *Remote onchain execution*
- **status**: Draft
- **type**: Core
- **created**: 20.01.2024

# Summary

This TEP proposes a way of how one contract may execute code (including get nethods) or read data of other contracts in asynchronous manner. Note: data may and often will become outdated during delivery and it MUST to be taken into account dduring protocol ddevelopment.

# Motivation

Currently, for inter-contract interactions are only possible when both contracts ready for this and implement corresponding functionality. Besider inter-contract interaction and contract-user interaction is completely decoupled which make contracts more cumbersome than possible.

# Specification
### Step 1: new types of internal messages
Currently, tags of Message constructors leave no room for extension (all tag space is occupied), but not all combinations of flags in CommonMsgInfo is used. In particular, message can not be with flag `bounce:True` and `bounced:True` simultaneously. Besides, instant hypercube routing is disabled as well (all delivery happens via "simple" hypercube routing).

So, it is proposed to change this declaration

```
int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
  src:MsgAddressInt dest:MsgAddressInt 
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
```
to
```
delivery_info$_
  src:MsgAddressInt dest:MsgAddressInt 
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonInternalMsgInfo;

int_msg_info_usual$0110 _:CommonInternalMsgInfo = CommonMsgInfo;
int_msg_info_no_bounce$0100 _:CommonInternalMsgInfo = CommonMsgInfo;
int_msg_info_bounced$0101 _:CommonInternalMsgInfo = CommonMsgInfo;

// We keep it to be able to parse history
int_msg_info_ihr_usual$0010 _:CommonInternalMsgInfo = CommonMsgInfo;
int_msg_info_ihr_no_bounce$0000 _:CommonInternalMsgInfo = CommonMsgInfo;

```


Now we "freed" `0111` prefix space and can use it for new types of internal messages, for instance
```
int_msg_info_remote_execution$01110000 _:CommonInternalMsgInfo = CommonMsgInfo;
int_msg_info_remote_execution_response$01110001 _:CommonInternalMsgInfo = CommonMsgInfo;
```

### Step 2: remote execution requests

Processing of remote execution request message (RER) on destination account happens similar to internal message processing with the following differences:
- instead of code and data of destination smart-contract, TVM c3 and c4 registers are initialised with code and data from RER' state init
- during initialisation, code and data of destination account are added to the stack in addition to "usual" stack variables (function selector, message body, message cell, etc)
- on Computation Phase finalization, c5 register ("output actions") is discarded, instead, a single `int_msg_info_remote_execution_response` is generated, message body contains ComputationPhase execution results (exit code, steps, gas used etc), while init_data contains code from RER and data from c4 register


Alternatively, result of RER can be sent via `int_msg_info_bounced`.

# Drawbacks

1. To this day it was strongly suggested to developers to not rely on volatile data, for instance jetton balance may change while message with answer will reach destination. This proposal open opportunity to do that even for contracts that who themselves did not implement such functionality and thus open possibility of great financial mistakes.
2. More types of internal messages make transaction execution more complicated.

# Rationale and alternatives

The reason why it is prohibited to send messages from RER tx:
RER tx outcoming messages should have source address equal to requester address, that means that message "from one shard" will be actually sent from the other. It severely complicates routing (OutMessageQueue is not ready to include messages from different shards) and it will be impossible to satisfy lt order guarantees. 

