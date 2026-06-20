# Guideline for TON Wallets: Mnemonic Schemes, Subwallet-ID and Wallet Smart Contracts

## 1. Scope

This document defines recommended behavior for wallet applications, SDKs, and libraries in the TON ecosystem when creating and importing wallets.

The goal is to improve interoperability between TON-native wallets and multichain wallets by standardizing:

- supported mnemonic schemes;
    
- mnemonic-to-key derivation;
    
- wallet smart contract discovery;
    
- user-facing import behavior;
    
- SDK and library import.
    
## 2. Terminology

A **mnemonic** is a human-readable set of recovery words used to derive a private key.

A **TON mnemonic** is a TON-specific 24-word mnemonic using the BIP39 word list but TON-specific key derivation.

A **Multichain mnemonic** is a BIP39 mnemonic used with BIP44 and SLIP-0010 Ed25519 derivation.

A **wallet account** is a TON blockchain account controlled by a wallet smart contract, such as Wallet V3R1, Wallet V3R2, Wallet V4R2, Wallet V5R1 or other.

A single mnemonic/key pair may correspond to multiple wallet smart contracts and therefore multiple TON blockchain accounts.

## 3. Mnemonic-to-Key Derivation

Historically, the TON ecosystem has widely used two mnemonic schemes.

Both schemes use the same BIP39 word list, but they differ in how the words are converted into entropy and then into Ed25519 private and public keys.

### 3.1 Multichain Mnemonic

A Multichain mnemonic uses:

```text
12 or 24 words
BIP39 -> BIP44 -> SLIP-0010 Ed25519
Derivation path: m/44'/607'/0'
```

This mnemonic is also widely used in other blockchains.

Example: https://www.npmjs.com/package/bip39, https://github.com/mytonwallet-org/mytonwallet/blob/2c0ef4ca0fafeab20802a22cf781bb5aa473b953/src/api/chains/ton/auth.ts#L101
### 3.2 TON Mnemonic

A TON mnemonic uses:

```text
24 words from the BIP39 word list
KDF: PBKDF2-HMAC-SHA512(words, "TON default seed", 100000)
Then Ed25519 key derivation
```

Example: https://github.com/toncenter/tonweb-mnemonic
## 4. New Wallet Creation: Mnemonic Scheme

When creating a new wallet for a user, wallet applications **MAY** use either of the following mnemonic schemes:

1. (Recommended) a 12-word Multichain mnemonic;
or
2. a 24-word TON mnemonic;

Wallet applications **SHOULD NOT** create new wallets using a 24-word Multichain mnemonic. This restriction is intended to reduce ambiguity during import and improve interoperability across the TON ecosystem.

## 5. New Wallet Creation: Smart Contract

When creating a new TON wallet account, wallet applications **SHOULD** use the **Wallet V5R1** (also called "w5") FunC smart contract by default.

https://github.com/ton-blockchain/wallet-contract-v5
## 6.  Wallet Smart Contract Subwallet-ID

When creating a new TON wallet account, wallet applications **SHOULD** use following wallet smart contract subwallet-id:

### V3R1 - V4R2

Mainnet: 0x29a9a317

Testnet:  0x29a9a317
### V5

Mainnet: 0x7FFFFF11

Testnet:  0x7FFFFFFD

## 7. Wallet Import: Smart Contract Discovery

In TON, the same mnemonic/key pair may correspond to multiple wallet smart contracts and therefore multiple blockchain accounts.

For example, the same key may control wallet accounts based on:

- Wallet V3R1;
    
- Wallet V3R2;
    
- Wallet V4R1;
    
- Wallet V4R2;
    
- Wallet V5R1.

[Code of wallet smart contracts](https://github.com/toncenter/tonweb/blob/master/src/contract/wallet/WalletSources.md).

When importing a key, wallet applications **SHOULD** discover and retrieve information for all supported wallet smart contracts from **V3R1 through V5R1** related to the key.

Wallet applications **SHOULD** display the full list of corresponding blockchain accounts to the user, including accounts with zero balance.

For each account, the application **SHOULD** show a short balance summary, including Gram (Toncoin) and, where available, token balances.

The user **SHOULD** then be able to select one or more blockchain accounts to add to the wallet application.

Wallet applications **SHOULD NOT** silently import only one account based on the highest balance.

Some wallet applications have historically imported only the account with the largest balance, usually the account with the largest Gram (Toncoin) balance. This behavior is not recommended. Explicit user selection from the full account list provides better interoperability and reduces the risk of hiding relevant accounts from the user.


## 8. Wallet Import: Mnemonic Scheme Detection

When importing an existing wallet, wallet applications **SHOULD** allow the user to enter either 12 or 24 words.

If the user enters **12 words**, the mnemonic **SHOULD** be treated as a Multichain mnemonic.

If the user enters **24 words**, the wallet application **SHOULD** validate the mnemonic against both supported schemes:

1. TON mnemonic validation by checksum;
    
2. Multichain/BIP39 mnemonic validation by checksum.
    

If the 24-word mnemonic is valid only as a TON mnemonic, the wallet application **SHOULD** import it as a TON mnemonic.

If the 24-word mnemonic is valid only as a Multichain mnemonic, the wallet application **SHOULD** import it as a Multichain mnemonic.

In approximately **0.4%** of cases, a 24-word mnemonic may be valid under both the TON mnemonic scheme and the Multichain mnemonic scheme.

In such cases, the wallet application **SHOULD NOT** choose one scheme silently. Instead, it **SHOULD** derive accounts for both schemes and show the resulting account list to the user for selection.

## 9. SDK and Library Requirements

SDKs and wallet libraries **SHOULD** support importing wallets from all of the following mnemonic types:

1. 24-word TON mnemonic;
    
2. 12-word Multichain mnemonic;
    
3. 24-word Multichain mnemonic.
    

Libraries and SDKs SHOULD use explicit naming conventions that clearly indicate the presence of multiple types of mnemonics within the ecosystem.

## 10. Background and Rationale

Originally, TON had only TON-specific wallets, such as:

- wallet.ton.org;
    
- early versions of Tonkeeper;
    
- early versions of MyTonWallet;
    
- early versions of  Tonhub;
    
- and other TON-native wallet applications.
    
These wallets used 24-word TON mnemonics.

Later, multichain wallets such as Trust Wallet, OKX Wallet, Bitget Wallet, and others added support for TON.

These multichain wallets typically created TON accounts from their existing 12-word Multichain mnemonics.

After that, some originally TON-specific wallets, such as MyTonWallet and Tonkeeper, also started supporting additional networks and became multichain wallets themselves. As part of this transition, some wallets started creating new wallets using Multichain mnemonics, including 24-word Multichain mnemonics.

Both TON-native wallets and multichain wallets began adapting to each other’s mnemonic schemes during import.

However, compatibility across wallet applications is still incomplete. In some cases, accounts created in one wallet cannot be imported correctly into another wallet, or only one of several possible wallet smart contract accounts is shown to the user.

This guideline exists to standardize expected wallet behavior and improve cross-wallet compatibility across the TON ecosystem.
