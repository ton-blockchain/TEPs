- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Deterministic subwallets
- **status**: Review
- **type**: Application
- **authors**: [oleganza](https://github.com/oleganza),  [ProgramCrafter](https://github.com/ProgramCrafter)
- **created**: 27.11.2022
- **replaces**: -
- **replaced by**: -

# Summary

Created during [TON Footstep 79](https://github.com/ton-society/ton-footsteps/issues/79).

This proposal introduces a standard way to create privacy-preserving subaccounts for a given wallet seed (aka mnemonic). Public keys of those wallets are indistinguishable from random so two wallets cannot be said to belong to a single owner (unless keys are disclosed).

# Motivation

Users who manage a number of assets for different purposes need to generate multiple wallets and switch between them. Each time a new wallet is generated, it needs to be backed up separately. We need a solution that lets create multiple independent wallets as subaccounts without redoing the work of backing things up.

This TEP improves usability and privacy of multi-wallet scenarios for all TON users.

# Guide

During key derivation, `entropy` is hashed together with subwallet index resulting in `seed_level0`. Then, final seed (wallet private key) is hash of `seed_level0` with salt `'TON default seed'`.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

Subwallet keys generation process is defined as follows:
1. **Mnemonic** is converted to **entropy** using `hmacSha512`.
2. This **entropy** is hashed with string **\["Subwallet #" + any chars (subaccount identifier)\]** using `hmacSha512` resulting in **seed_level0**.
3. Then **seed_level0** is hashed via `pbkdf2Sha512` with salt "TON default seed" and 10000 iterations, first 32 bytes of result are returned as wallet private key.

Sample implementation in JS:

```
async function subwalletMnemonicToSeed(mnemonicArray, password, subwallet) {
  const entropy = await mnemonicToEntropy(mnemonicArray, password);
  
  const seed_level0 = await hmacSha512(entropy, 'Subwallet #' + subwallet);
  const seed = await pbkdf2Sha512(seed_level0, 'TON default seed', PBKDF_ITERATIONS);
  
  return seed.slice(0, 32);
}
```

If user chooses that knowledge of his mnemonic is sufficient for exploring his assets, wallet application MUST use decimal representation of consequent numbers starting with 0 as subwallet identifiers. Otherwise, application SHALL either allow user to generate subaccount ID or generate and store it itself.  
Applications, especially desktop ones, are RECOMMENDED to make user able to enter any combination of bytes as subwallet ID (maybe in HEX format).  
Applications SHOULD display a warning if subaccount identifier is alphanumeric and has a trailing whitespace.

Wallet applications MUST display amount of user assets separately for each wallets and OPTIONALLY can display total amount.

[tonweb-mnemonic](https://github.com/toncenter/tonweb-mnemonic/) JS library and similar ones in another languages MUST define function `subwalletMnemonicToSeed` accepting three arguments - array with mnemonic words, wallet password and subwallet identifier.

# Drawbacks

Users may remember their mnemonic words but forget subwallet identifier thus losing funds.

# Rationale and alternatives

- Subwallet identifier is chosen to be string to allow both fully non-discoverable wallet (even if user leaks his mnemonic words, his funds are temporarily safe until attacker finds correct subwallet) and accounts that can be explored knowing mnemonics (these are privacy-preserving because they can't be associated with each other from outside)
- Subwallet is added using hmacSha512 because afterwards seed is hashed `PBKDF_ITERATIONS` times so there is no need to slow down wallet generation process even more
- Subwallet is added before "TON default seed" because otherwise it would be pretty fast to bruteforce wallets with known mnemonic

# Prior art

This is subset of BIP32 aimed at hardened keys only.

# Unresolved questions

None

# Future possibilities

None
