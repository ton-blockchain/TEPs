- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Custom payload offchain source for Jettons
- **status**: Draft
- **type**: Contract Interface
- **authors**: [Denis Subbotin](https://github.com/mr-tron)
- **created**: 18.07.2024
- **replaces**: -
- **replaced by**: -

# Summary

Extension for [Jetton](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md) that allows off-chain providing custom payload required for transfer tokens.


# Motivation

Required by [mintless jettons](https://github.com/ton-blockchain/TEPs/blob/master/text/0000-compressed-jetton-standard.md) but can be useful in other cases like signed mint, vesting, oracles, etc.

# Guide



### Useful links

1. [Reference API implementation for mintles jetton standard](https://github.com/tonkeeper/cJetton-back)


# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.


## API

This API only describes the method for obtaining data that must be included in the `custom_payload` when transferring jetton.

### Metadata

In metadate stored according to [Metadata standard](https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md) should be added field `custom_payload_api_url` with `string` type in json or `ContentData` type in TL-B:

```json
{
  "custom_payload_api_url":  "https://example.com/api/v1/jetton/0:1234567890absdef1234567890absdef1234567890absdef1234567890absdef"
}
```

`custom_payload_api_url` is the **final** (i.e. including any postfixes) root API URI **without a trailing slash `/`**


### API version 1

Once a user has obtained and decoded the URI from metadata:

(`:arg` means an argument with name `arg`)

##### 1. `/wallet/:address`

`address` is raw encoded addr_std of jetton_wallet owner (NOT jetton_wallet address). (example: `0:1234567890absdef1234567890absdef1234567890absdef1234567890absdef`)
Returns full information about a particular wallet including the `CustomPayload` that should be attchaed to transfer.

MUST return a JSON object with the following fields:

| Name           | Type   | Description                                                                                      |
|----------------|--------|--------------------------------------------------------------------------------------------------|
| owner          | string | wallet owner address in raw form                                                                 | 
| jetton_wallet  | string | jetton_wallet address in raw form      TODO: maybe should be removed to avoid incositency in API |
| custom_payload | string | Custom payload which wallet MUST attach to transfer message. Serialized as base64 BoC            |

MUST return some field in specific cases:

| Name            | Type   | Case                    | Description                                                                 |
|-----------------|--------|-------------------------|-----------------------------------------------------------------------------|
| state_init      | string | claim compressed jetton | State init SHOULD be attached to transfer message. Serialized as base64 BoC |
| compressed_info | object | claim compressed jetton | |


Other fields MAY be returned.

Example:

```json
{
  "owner": "0:0000000000000000000000000000000000000000000000000000000000000000",
  "jetton_wallet": "0:1234567890absdef1234567890absdef1234567890absdef1234567890absdef",
  "custom_payload": "te6cckEBBgEAeQACAAEDAUOAFa1KqA2Oswxbo4Rgh/q6NEaPLuK9o3fo1TFGn+MySjqQAgAMMi5qc29uAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQBQF4S3GMDJY/HoZd6TCREIOnCaYlF23hNzJaSsfMd1S7nBQAA8muEeQ==",
  "state_init": "te6ccgECGAEABLAAAgE0AgEBhwgBm5yw6LpMut8/oVy48oR5MjqgHd8X80GPKq12i/8q260APgFPbn4IpB/3t4HNXmxz7Qp2VJj46hROuO+ZFb+FyIegAgEU/wD0pBP0vPLICwMCAWIEBQICzAYHABug9gXaiaH0AfSB9IGoYQIB1AgJAgEgCgsAwwgxwCSXwTgAdDTAwFxsJUTXwPwDOD6QPpAMfoAMXHXIfoAMfoAMHOptAAC0x+CEA+KfqVSILqVMTRZ8AngghAXjUUZUiC6ljFERAPwCuA1ghBZXwe8upNZ8AvgXwSED/LwgABE+kQwcLry4U2ACASAMDQCD1AEGuQ9qJofQB9IH0gahgCaY/BCAvGooypEF1BCD3uy+8J3QlY+XFi6Z+Y/QAYCdAoEeQoAn0BLGeLAOeLZmT2qkAvVQPTP/oA+kAh8AHtRND6APpA+kDUMFE2oVIqxwXy4sEowv/y4sJUdAJwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAySD5AHB0yMsCygfL/8nQBfpA9AQx+gAg10nCAPLixCD0BD=",
    "compressed_info": {
        "amount": "1000000000",
        "start_from": "1673808578",
        "expired_at": "1721080197"
        }
}
```

##### 2. `/wallets?next_from=:next_from&count=:count`

Returns information about multiple jetton wallets at once.

API implementations MAY impose a limit on the `count` argument. If `count` exceeds the imposed limit, 
the API implementations MUST treat that request as if it had `count` set to the imposed limit, instead of the actual `count`.

`next_from` SHOULD be valid raw address format. API MUST return wallets with owner address equal or greater than requested.

Wallets MUST be sorted by owner address in ascending order.

MUST return a JSON object with the following fields:

| Name      | Type     | Description                                                                                   |
|-----------|----------|-----------------------------------------------------------------------------------------------|
| wallets   | object[] | An array of at most `count` jetton objects,                                                   |
| next_from | number   | Wallet address what should be used for requesting next batch. Empty string in the end of list |

Other fields MAY be returned.

Example: (with `next_from` 0:0000000000000000000000000000000000000000000000000000000000000000, `count` 2)
```json
{
	"wallets": [
      {
        "owner": "0:00000000000000000000000000000000000000000000000000000000000000f0",
        "jetton_wallet": "0:1234567890absdef1234567890absdef1234567890absdef1234567890absdef",
        "custom_payload": "te6cckEBBgEAeQACAAEDAUOAFa1KqA2Oswxbo4Rgh/q6NEaPLuK9o3fo1TFGn+MySjqQAgAMMi5qc29uAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQBQF4S3GMDJY/HoZd6TCREIOnCaYlF23hNzJaSsfMd1S7nBQAA8muEeQ==",
        "state_init": "te6ccgECGAEABLAAAgE0AgEBhwgBm5yw6LpMut8/oVy48oR5MjqgHd8X80GPKq12i/8q260APgFPbn4IpB/3t4HNXmxz7Qp2VJj46hROuO+ZFb+FyIegAgEU/wD0pBP0vPLICwMCAWIEBQICzAYHABug9gXaiaH0AfSB9IGoYQIB1AgJAgEgCgsAwwgxwCSXwTgAdDTAwFxsJUTXwPwDOD6QPpAMfoAMXHXIfoAMfoAMHOptAAC0x+CEA+KfqVSILqVMTRZ8AngghAXjUUZUiC6ljFERAPwCuA1ghBZXwe8upNZ8AvgXwSED/LwgABE+kQwcLry4U2ACASAMDQCD1AEGuQ9qJofQB9IH0gahgCaY/BCAvGooypEF1BCD3uy+8J3QlY+XFi6Z+Y/QAYCdAoEeQoAn0BLGeLAOeLZmT2qkAvVQPTP/oA+kAh8AHtRND6APpA+kDUMFE2oVIqxwXy4sEowv/y4sJUdAJwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAySD5AHB0yMsCygfL/8nQBfpA9AQx+gAg10nCAPLixCD0BD=",
        "compressed_info": {
          "amount": "1000000000",
          "start_from": "1673808578",
          "expired_at": "1721080197"
        }
      },
      {
        "owner": "0:00000000000000000000000000000000000000000000000000000000000000f3",
        "jetton_wallet": "0:75a4a45ee80434951243bbe404db214900af3eecc185a504902dce4b65f1c16e",
        "custom_payload": "te6cckEBBgEAeQACAAEDAUOAFa1KqA2Oswxbo4Rgh/q6NEaPLuK9o3fo1TFGn+MySjqQAgAMMi5qc29uAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQBQF4S3GMDJY/HoZd6TCREIOnCaYlF23hNzJaSsfMd1S7nBQAA8muEeQ==",
        "state_init": "te6ccgECGAEABLAAAgE0AgEBhwgBm5yw6LpMut8/oVy48oR5MjqgHd8X80GPKq12i/8q260APgFPbn4IpB/3t4HNXmxz7Qp2VJj46hROuO+ZFb+FyIegAgEU/wD0pBP0vPLICwMCAWIEBQICzAYHABug9gXaiaH0AfSB9IGoYQIB1AgJAgEgCgsAwwgxwCSXwTgAdDTAwFxsJUTXwPwDOD6QPpAMfoAMXHXIfoAMfoAMHOptAAC0x+CEA+KfqVSILqVMTRZ8AngghAXjUUZUiC6ljFERAPwCuA1ghBZXwe8upNZ8AvgXwSED/LwgABE+kQwcLry4U2ACASAMDQCD1AEGuQ9qJofQB9IH0gahgCaY/BCAvGooypEF1BCD3uy+8J3QlY+XFi6Z+Y/QAYCdAoEeQoAn0BLGeLAOeLZmT2qkAvVQPTP/oA+kAh8AHtRND6APpA+kDUMFE2oVIqxwXy4sEowv/y4sJUdAJwVCATVBQDyFAE+gJYzxYBzxbMySLIywES9AD0AMsAySD5AHB0yMsCygfL/8nQBfpA9AQx+gAg10nCAPLixCD0BD=",
        "compressed_info": {
          "amount": "20000000000",
          "start_from": "1673808578",
          "expired_at": "1721080197"
        }
      }
	]
}
```

##### 3. `/state`

Returns general information about this API instance.

MUST return a JSON object with the following fields:

| Name           | Type | Description                                                                                            |
|----------------| --- |--------------------------------------------------------------------------------------------------------|
| total_wallets  | number | Number of all wallets that can be requested via api. Negative if data can be requested for any wallet. |
| master_address | string | The address of the jettpn smart contract that this API augments. Raw encoded.                          |

Other fields MAY be returned.

Example:
```json
{
	"total_wallets": "1000500",
	"address": "0:0000000000000000000000000000000000000000000000000000000000000000"
}
```