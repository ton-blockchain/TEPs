- **TEP**: [142](https://github.com/ton-blockchain/TEPs/pull/142)
- **title**: TBRC-20 Inscription Token Standard
- **status**: Draft
- **type**: Contract Interface
- **authors**: [TBRC-20 Team](https://github.com/tbrc20)
- **created**: 26.01.2024

# Summary

This document proposes a new standard for TBRC-20/Jetton dual-standard inscription, an innovation based on the TON network. TBRC-20 aims to provide a transparent, efficient and secure token issuance and transaction method through a decentralized approach.

# Motivation

The TON blockchain is innovative in its use of plaintext messages for smart contract interfaces.

TBRC-20 aims to combine the plaintext comment feature of transactions the TON chain with the ease of use of the Jetton standard to provide a transparent, secure, efficient and decentralized dual-standard token. This standard not only takes advantage of the transparency and ease-of-use of the plaintext message, but also provides compatibility with other existing smart contracts with its native Jetton interface.

# Proposal

Users interact TBRC-20 tokens by sending plaintext JSON messages to TBRC-20/Jetton master/wallet contracts. In addition to mint/transfer, users can also list their tokens for sale direction in their Jetton wallets. The advantage is that messages can be constructed manually, and are easily readable in wallets and block explorers, so that users can easily inspect and verify the transaction, improving both convenience and safety.

# Specification

The technical specifications of the TBRC-20/Jetton dual standard detail the operation methods of token minting, transfer and market transactions. In addition to normal Jetton methods, the smart contracts must accept the following types of plaintext messages:

## Mint (inscribe)
Send TON transfers (with enough TON to pay for gas) with the following message to the TBRC-20/Jetton master:

    ```text
    {'p':'tbrc-20','op':'mint','tick':'$TICK','amt':'$AMOUNT'}
    ```

`$TICK` is the token ticker (such as "tbrc"), it should be alphanumerical.

`$AMOUNT` is the amount of tokens. The amount is to be parsed in the following manner (assuming 9 decimal places):

- If it consists of only numbers then it's parsed as nanotons. "1234" is 1234 nanotons or 0.000001234 tons.
- If it starts with numbers and ends with 'n' or 'N', then the numbers are parsed as nanotons. "1234n" is 1234 nanotons or 0.000001234 tons.
- If it consists of numbers and a decimal point, then it's parsed as tons. "1.234" is 1234000000 nanotons or 1.234 tons. "123." is 123000000000 nanotons or 123 tons.

## Transfer

Send the following message to a user's own TBRC-20/Jetton wallet contract:

    ```text
    {'p':'tbrc-20','op':'transfer','tick':'$TICK','amt':'$AMOUNT','to':'$ADDRESS'}
    ```

`$TICK` is the token ticker (such as "tbrc"), it should be alphanumerical.

`$AMOUNT` is the amount of tokens. The amount is to be parsed in the same manner as described above.

`$ADDRESS` is the recipient's wallet address in EQ or UQ format.

## List

Users can list their TBRC-20 for sale by sending the following message to his TBRC-20 wallet contract:

    ```text
    {'p':'tbrc-20','op':'list','tick':'$TICK','amt':'$AMOUNT','price':'$PRICE'}
    ```

`$TICK` is the token ticker (such as "tbrc"), it should be alphanumerical.

`$AMOUNT` is the amount of tokens. The amount is to be parsed in the same manner as described above.

`$PRICE` is the *total* price in TON/nanoton to be paid for the entire `$AMOUNT` of TBRC-20 tokens. Anyone can buy from a listing by sending a Buy message to the TBRC-20/Jetton wallet which has the listing with TON attached, as described below. The entire amount must be purchased. A user may list up to 100 listings. Multiple listings at the same price and amount are allowed. Tokens listed are still visible as part of the total balance, but listed amounts are locked and untransferrable until the listing is subsequently bought or unlisted.

## Unist

Users can unlist their TBRC-20 for sale by sending the following message to his TBRC-20 wallet contract:

    ```text
    {'p':'tbrc-20','op':'unlist','tick':'$TICK','amt':'$AMOUNT','price':'$PRICE'}
    ```

The `$TICK` `$AMOUNT` and `$PRICE` must exactly correspond to an existing listing, otherwise the operation would fail. If multiple listings with the same `$TICK` `$AMOUNT` and `$PRICE` exist, then each Unlist message cancels only one of such listings.

## Buy

Anyone can call the wallet with the following JSON to buy (attaching the amount of TON required):

    ```text
    {'p':'tbrc-20','op':'buy','tick':'$TICK','amt':'$AMOUNT','price':'$PRICE'}
    ```

The caller must attach to the call at least `$PRICE + gas cost` TONs to the message, otherwise the operation must fail, returning any unspent gas (at least equal to `$PRICE`) to the caller.

## Get-methods

The following get methods must be implemented in the TBRC-20/Jetton wallet contract:

1. `get_listing_len()` returns `(int length)`. `length` is the number of listings.
2. `get_listing(int listing_id)` returns `(int amount, int price)`. `amount` is the amount of TBRC-20/Jettons to sell, `price` is the total price for the tokens.
3. `get_locked_balance()` returns `(int amount)`. `amount` is the amount of tokens listed for sale and thus temporarily locked.

## Notes

The JSON messages sent must be all small caps, use single quotes and must not contain spaces. The order of fields in the JSON messages shall not change. This is due to gas cost considerations.

# Drawbacks

Although TBRC-20 offers many advantages, it also has some limitations, such as extra gas cost and initial wallets and tooling support.

# Prior art

- [TEP-74 Jettons standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)

# Unresolved questions

This standard imposes the additional limitation that the field ordering of JSON messages shall not change for gas cost reasons. Is this necessary?

# Future possibilities

As this TBRC-20 matures and when it is widely adopted by the community, we can explore how to implement generic smart contract interfaces using plaintext messages.
