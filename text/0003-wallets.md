# Guideline for TON Wallets: Mnemonic Schemes, Subwallet-ID and Wallet Smart Contracts

## 1. Scope

This document defines recommended behavior for wallet applications, SDKs, and libraries in the TON ecosystem when creating and importing wallets.

The goal is to improve interoperability between TON-native wallets and multichain wallets by standardizing:

- supported mnemonic schemes;
    
- mnemonic-to-key derivation;
    
- wallet smart contract discovery;
    
- user-facing import behavior;
    
- SDK and library import;

- sub-wallets derivation;
    
## 2. Terminology

A **mnemonic** is a human-readable set of recovery words used to derive a private key.

A **TON mnemonic** is a TON-specific 24-word mnemonic using the BIP39 word list but TON-specific key derivation.

A **multichain mnemonic** is a BIP39 mnemonic used with BIP44 and SLIP-0010 Ed25519 derivation.

A **rotation mnemonic** is a 24-word mnemonic made up of two 12-word multichain mnemonics: an **anchor half** (words 1-12) and a **signing half** (words 13-24).

An **anchor key** is the key pair derived from the anchor half. It determines the wallet account address and authorizes the first replacement of the signing key. It never changes.

A **signing key** is the key pair derived from the signing half. It signs ordinary outgoing messages of the wallet account and is replaced on rotation.

**Rotation** is the replacement of the signing key of a wallet account without changing the account address.

A **wallet account** is a TON blockchain account controlled by a wallet smart contract, such as Wallet V3R1, Wallet V3R2, Wallet V4R2, Wallet V5R1, or others.

A single mnemonic or key pair may correspond to multiple wallet smart contracts, and therefore multiple TON blockchain accounts.

## 3. Mnemonic-to-Key Derivation

Historically, the TON ecosystem has widely used two mnemonic schemes, described in sections 3.1 and 3.2. Section 3.3 defines a third one, rotation mnemonic, which consists of two 12-word multichain mnemonics.

All schemes use the same BIP39 word list, but they differ in how the words are converted into entropy and then into Ed25519 private and public keys.

### 3.1 Multichain Mnemonic

A multichain mnemonic uses:

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
KDF: PBKDF2-HMAC-SHA512( HMAC-SHA512(words), "TON default seed", 100000)
Then Ed25519 key derivation
```

Example: https://github.com/toncenter/tonweb-mnemonic

### 3.3 Rotation Mnemonic

A rotation mnemonic uses:

```text
24 words from the BIP39 word list,
formed as two 12-word multichain mnemonics

words 1-12  -> anchor half  -> anchor key
words 13-24 -> signing half -> signing key

each half separately:
BIP39 -> BIP44 -> SLIP-0010 Ed25519
Derivation path: m/44'/607'/0'
```

Each half **MUST** be a valid 12-word multichain mnemonic as defined in section 3.1, including its BIP39 checksum.

Each half **MUST** be converted to a BIP39 seed on its own, from the 12 words of that half only. The 24 words **MUST NOT** be joined and treated as a single BIP39 mnemonic, and the two seeds **MUST NOT** be combined.

Both halves use the same derivation path. The two key pairs differ only because their seeds differ.

| Half   | Words | Key         | Role                                                       |
|--------|-------|-------------|------------------------------------------------------------|
| First  | 1-12  | Anchor key  | Determines the wallet account address; authorizes the first rotation |
| Second | 13-24 | Signing key | Signs ordinary outgoing messages; is replaced on rotation  |

The anchor half **MUST** be generated from a cryptographically secure random source.

A rotation mnemonic has exactly two permitted forms:

1. **Initial form** — words 13-24 repeat words 1-12 word for word. The account's signing key has never been replaced, and the anchor key is also the current signing key.

2. **Rotated form** — words 13-24 are a 12-word multichain mnemonic generated from a cryptographically secure random source, independently of words 1-12 and of every earlier signing half.

No other relationship between the two halves is permitted. In particular, a signing half **MUST NOT** be computed from the anchor half, or from an earlier signing half, by hashing, re-indexing or any other deterministic transformation.

Every rotation **MUST** produce a signing half of the rotated form, and **MUST NOT** set the signing half back to the anchor half.

Unlike the schemes in sections 3.1 and 3.2, a rotation mnemonic does not describe a single fixed key: its signing half changes over time while the account address stays the same. Section 13 defines the wallet account behavior that makes this possible.

## 4. New Wallet Creation: Mnemonic Scheme

When creating a new wallet for a user, wallet applications **MAY** use either of the following mnemonic schemes:

1. (Recommended) a 12-word multichain mnemonic;

or

2. a 24-word TON mnemonic;

Wallet applications **SHOULD NOT** create new wallets using a 24-word multichain mnemonic. This restriction is intended to reduce ambiguity during import and improve interoperability across the TON ecosystem.

Wallet applications **SHOULD NOT** create new wallets using a rotation mnemonic either. A rotation mnemonic is only meaningful for an application that also implements the rotation-capable wallet account of section 13. The wallet in Telegram is that application, and rotation mnemonics are expected to originate there and nowhere else. Every other wallet application meets them on import, never on creation.

## 5. New Wallet Creation: Smart Contract

When creating a new TON wallet account, wallet applications **SHOULD** use the **Wallet V5R1** (also called "w5") FunC smart contract by default.

https://github.com/ton-blockchain/wallet-contract-v5

## 6. Wallet Smart Contract Subwallet-ID

When creating a new TON wallet account, wallet applications **SHOULD** use the following wallet smart contract subwallet IDs:

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

Some wallet applications have historically imported only the account with the largest balance, usually the account with the largest Gram (Toncoin) balance. This behavior is not recommended. Explicit user selection from the full account list improves interoperability and reduces the risk of hiding relevant accounts from the user.


## 8. Wallet Import: Mnemonic Scheme Detection

When importing an existing wallet, wallet applications **SHOULD** allow the user to enter either 12 or 24 words.

If the user enters **12 words**, the mnemonic **SHOULD** be treated as a multichain mnemonic.

If the user enters **24 words**, the wallet application **SHOULD** validate the mnemonic against all supported schemes:

1. TON mnemonic validation by checksum;

2. Multichain/BIP39 mnemonic validation by checksum;

3. Rotation mnemonic validation by two checksums, one on words 1-12 and one on words 13-24.

Support for rotation mnemonics is **OPTIONAL**. A wallet application that does not support them **MAY** skip validation 3. Such a phrase then fails validations 1 and 2 and is reported to the user as an invalid mnemonic, which is the expected outcome.

If the 24-word mnemonic is valid only as a TON mnemonic, the wallet application **SHOULD** import it as a TON mnemonic.

If the 24-word mnemonic is valid only as a multichain mnemonic, the wallet application **SHOULD** import it as a multichain mnemonic.

If the 24-word mnemonic is valid only as a rotation mnemonic, a wallet application that supports rotation mnemonics **SHOULD** import it as described in section 13.2.

Whenever a 24-word phrase is valid under more than one scheme, the wallet application **SHOULD NOT** pick a scheme silently. It **SHOULD** derive the accounts for every scheme that validates and present them to the user for selection, as described in section 7.

## 9. SDK and Library Requirements

SDKs and wallet libraries **SHOULD** support importing wallets from all of the following mnemonic types:

1. 24-word TON mnemonic;
    
2. 12-word multichain mnemonic;
    
3. 24-word multichain mnemonic.

SDKs and wallet libraries **MAY** additionally support importing 24-word rotation mnemonics.

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

These multichain wallets typically created TON accounts from their existing 12-word multichain mnemonics.

Later, some originally TON-specific wallets, such as MyTonWallet and Tonkeeper, also began supporting additional networks and became multichain wallets themselves. As part of this transition, some wallets started creating new wallets using multichain mnemonics, including 24-word multichain mnemonics.

Both TON-native wallets and multichain wallets began adapting to each other’s mnemonic schemes during import.

However, compatibility across wallet applications is still incomplete. In some cases, accounts created in one wallet could not have been imported correctly into another, or only one of several possible wallet smart contract accounts was shown to the user.

This guideline exists to standardize expected wallet behavior and improve cross-wallet compatibility across the TON ecosystem.

## 11. Subwallets

To generate a set of sub-wallets based on a single mnemonic phrase, it is recommended to use the multichain mnemonic with the derivation path `m/44'/607'/{i}'`, where `i` is the subwallet index.

This method is widely used and compatible with other blockchains.

Code example: https://github.com/mytonwallet-org/mytonwallet/blob/2c0ef4ca0fafeab20802a22cf781bb5aa473b953/src/api/chains/ton/auth.ts#L268

## 12. Subwallets Background and Rationale

The TON wallet smart contract includes a `subwalletId` field that could be used to generate multiple subwallets associated with a single key. However, it makes it clear that these subwallets belong to the same key, whereas users typically want a subwallet without that explicit link. Therefore, this field should not be used for user scenarios; it is intended for replay protection between mainnet and testnet, and service backends may use the ID at their discretion.

As of 2026, the vast majority of wallets that support TON and subwallet generation use the proposed multichain mnemonic and derivation path described in section 11.

An interesting exception is Tonkeeper Pro, which offers its own method for generating sub-wallets from a single mnemonic phrase, with each sub-wallet having its own mnemonic phrase.

However, to ensure compatibility among wallets, we recommend the method described in section 11.

## 13. Rotation Mnemonic: Wallet Account and Import

Section 13.1 applies to a wallet application that creates and operates rotation wallets. Section 13.2 applies to every wallet application that wants to import them and is what the rest of the ecosystem needs.

### 13.1 Account requirements

A rotation mnemonic requires a wallet smart contract that keeps its current signing public key separately from the values that determine its address.

Such a contract **MUST** satisfy all of the following:

1. The account address **MUST** be derived from the anchor public key, and **MUST NOT** depend on the current signing public key.

2. The contract stores a current signing public key, and that key **MUST** be the only key accepted for ordinary outgoing messages.

3. The initial stored signing public key **MUST** be the anchor public key.

4. A message authorized by the current signing key **MUST** be able to replace the stored signing public key.

Sections 5 and 6 do not apply to rotation wallets. Wallet V3R1 through V5R1 have no rotatable signing key, and the behavior of a rotation mnemonic with them is not defined; a wallet application **MUST NOT** deploy a V3R1-V5R1 account from a rotation mnemonic.

### 13.2 Import

When importing a rotation mnemonic, a wallet application:

1. derives the anchor key from words 1-12 and the signing key from words 13-24, as described in section 3.3;

2. computes the account address from the anchor key, subwallet ID and wallet contract code;

3. reads the account state and compares the stored signing public key with the signing key derived from words 13-24.

If the two match, the phrase is current and the account can be used immediately.

If they do not match, the phrase carries an outdated signing half. The wallet application **SHOULD** treat the mnemonic as invalid.

The contract itself, including its code and subwallet ID, is out of scope for this document; it is defined by the [WalletTg implementation](https://github.com/ton-blockchain/tg-wallet-contract).
