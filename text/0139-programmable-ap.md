- **TEP**: [139](https://github.com/ton-blockchain/TEPs/pull/139)
- **title**: *Programmable Action Phase*
- **status**: Draft
- **type**: Core
- **created**: 20.01.2024 

# Summary

Programmable Action Phase will increase flexibility of contract behavior and simplify logic in Computation Phase for the cases when result should depend on some actions success/fail.

# Motivation

Currently, during computation phase, smart contract composes special register `c5` "output actions": encoded ordered list of actions that will be later executed in Action Phase. Since both Computation Phase (through gas spending) and Action Phase (through message sending) use the the same TON from account balance, often it is impossible to predict result of Action Phase execution.

Lack of conditioned execution ability in Action Phase reduces the flexibility of contract behavior and make Computation Phase more complicated.

# Specification

Current construction of "output actions" can be considered as program with a sequence of actions itself:
```
1. Try first action.
     If not successful check mode;
        if mode allows to ignore errors go to 2, 
        else check mode;
            if mode requires bounce and bounce applicable - send bounce message, 
            else fail Action Phase.
3. ...
4. ...
```



From this standpoint it seems expedient to make `c5` "output actions" cycle-less program richer by expand action phase with more "operators": conditions and logic gates.


One of the way to do it is to enrich current declarations:
```

out_list_node$_ prev:^Cell action:OutAction = OutListNode;

action_send_msg#0ec3c86d mode:(## 8) out_msg:^(MessageRelaxed Any) = OutAction;
action_set_code#ad4de08e new_code:^Cell = OutAction;
action_reserve_currency#36e6b809 mode:(## 8) currency:CurrencyCollection = OutAction;
action_change_library#26fa1dd4 mode:(## 7) libref:LibRef = OutAction;
```

with additional actions:

```
action_operator_and#12345678 first_action_list:OutListNode second_action_list:OutListNode = OutAction;
action_operator_xor#1234567a first_action_list:OutListNode second_action_list:OutListNode = OutAction;
action_operator_try_catch#12345679 try_action_list:OutListNode catch_action_list:OutListNode = OutAction;
...
```

Where `action_operator_and` first executes all actions from first list and then all actions from second list (and escalates exceptions up if any), `action_operator_xor` does the same but throws if both list executions are successful, `action_operator_try_catch` tries to execute "try list" and, if unsuccessful, executes "catch list". Together, `action_operator_and` and `action_operator_try_catch` gives opportunity for "try-catch-else" behavior.




On TVM level access to this behavior can be done through new op-codes:

`C5ADDSENDMSG` : `c5 c x - c5'` - Update `c5` cell (assuming it is OutListNode) with message `c` and mode `x`.

`C5ADDAND` : `c5 c5' c5'' - c5'''` - Update `c5` cell with operator `AND` with `c5'` and `c5''` as branches.

`C5ADDXOR` : `c5 c5' c5'' - c5'''` - Update `c5` cell with operator `XOR` with `c5'` and `c5''` as branches.

`C5ADDTRYCATCH` : `c5 c5' c5'' - c5'''` - Update `c5` cell with operator try-catch  with `c5'` and `c5''` as branches.


# Drawbacks

This proposal being implemented will make Action Phase execution more complicated. It will be harder to analyze `c5` on correctness as well as description in analytical tools (i.e. explorers) what was done in Action Phase and how fee is calculated.

Besides, the disadvantage of this solution of Action Phase extension is the inconsistency of parsing: OutListNode are stored in reverse order (from last action to first), while operators are more about direct order of execution.

The purpose of this TEP is to reveal through wider discussion usecases where programmable Action Phase severely simplifies Computation Phase or improves contracts flexibility, as well as to understand the right way it should be implemented.

