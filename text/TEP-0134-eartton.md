---
TEP: 0134
title: Eartton - Advanced DeFi Token Standard
status: Draft
type: Standards Track
category: Interface
author: Eartton Team
created: 2024-02-20
requires: TEP-74
---

# Eartton Token Standard

## Simple Summary
An advanced token standard for TON that extends Jetton with integrated DeFi capabilities.

## Abstract
Eartton introduces a comprehensive token standard that builds upon TEP-74 (Jetton) to provide built-in mechanisms for liquid staking, AMM functionality, dynamic tokenomics, and decentralized governance. This standard aims to simplify DeFi development on TON while maintaining high efficiency and security.

## Motivation
Current DeFi development on TON requires multiple separate contracts and protocols for advanced functionality, leading to:
1. Increased complexity and development time
2. Higher gas costs from multiple contract interactions
3. Potential security risks from complex integrations
4. Fragmented liquidity across protocols

Eartton solves these issues by providing an all-in-one solution that maintains compatibility with existing infrastructure while adding advanced functionality.

## Specification

### Overview
Eartton implements all standard Jetton interfaces and adds the following components:

1. Master Contract (Token Management)
2. Staking Contract (Liquid Staking)
3. Pool Contract (AMM)
4. Wallet Contract (Extended Functionality)

### Contract Interfaces

#### Master Contract
```func
;; Storage Structure
storage#_ total_supply:Coins
         owner_address:MsgAddress
         content:^Cell
         jetton_wallet_code:^Cell
         burn_rate:uint16
         staking_apr:uint16
         farming_pool_size:Coins
         paused:Bool
         blacklist:^Cell
         governance:^Cell
         last_distribution_time:uint64
         dynamic_params:^Cell = Storage;

;; Required Methods
- get_wallet_address(slice owner_address)
- get_jetton_data()
- get_eartton_params()
```

#### Staking Contract
```func
;; Storage Structure
storage#_ total_staked:Coins
         exchange_rate:uint32
         sttoken_supply:Coins
         master_address:MsgAddress
         stakers:^Cell
         rewards_pool:Coins = Storage;

;; Required Methods
- stake(uint128 amount, uint32 lock_period)
- unstake(uint128 amount)
- claim_rewards()
```

#### Pool Contract
```func
;; Required Methods
- swap(uint128 amount_in, uint128 min_amount_out)
- add_liquidity(uint128 amount_a, uint128 amount_b)
- remove_liquidity(uint128 lp_amount)
```

### Operation Codes
```func
const int op::transfer = 0xf8a7ea5;
const int op::mint_sttoken = 0x1234F201;
const int op::swap = 0x1234F301;
const int op::propose_vote = 0x1234F001;
// ... other operation codes
```

### Features

#### 1. Dynamic Tokenomics
- Adaptive burn rate based on market conditions
- Dynamic staking APR
- Automatic parameter adjustments

#### 2. Liquid Staking
- Immediate stToken minting
- Flexible lock periods
- Compound rewards

#### 3. Built-in AMM
- Constant product formula
- Dynamic fees
- Slippage protection

#### 4. Governance
- Parameter modification
- Access control
- Transparent execution

### Security Considerations

1. Front-running Protection
```func
;; Example implementation
if (block.timestamp > deadline) {
    throw(error::deadline_exceeded);
}
```

2. Reentrancy Guard
```func
;; Example implementation
if (in_progress) {
    throw(error::reentrant_call);
}
in_progress = true;
```

3. Access Control
```func
;; Example implementation
if (!equal_slices(sender_address, owner_address)) {
    throw(error::unauthorized);
}
```

## Rationale
The design decisions in Eartton prioritize:
1. Gas efficiency
2. Security
3. Ease of integration
4. Backward compatibility

## Backwards Compatibility
Eartton maintains full compatibility with TEP-74 (Jetton) while extending functionality.

## Test Cases
Complete test suite available at: [github.com/Podkrandash/eartton/tests](https://github.com/Podkrandash/eartton/tests)

## Reference Implementation
The reference implementation is available at: [github.com/Podkrandash/eartton](https://github.com/Podkrandash/eartton)

## Security Considerations
1. Smart contract security
2. Economic security
3. Governance security
4. Integration security

## Copyright
Copyright and related rights waived via [MIT License](LICENSE) 