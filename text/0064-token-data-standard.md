- **TEP**: [64](https://github.com/ton-blockchain/TEPs/pull/0)
- **title**: Token Data Standard
- **status**: Draft
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK), [Tolya](https://github.com/tolya-yanot)
- **created**: 03.02.2022
- **replaces**: -
- **replaced by**: -

# Summary

A standard interface for tokens (meta)data (in particular [NFT](https://github.com/ton-blockchain/TIPs/issues/62) or [Jettons](https://github.com/ton-blockchain/TIPs/issues/74)).

# Motivation

For applications like wallets or marketplaces it is quite useful to be able automatically retrieve information for display. Token data standard allows to simplify this process and uniform the way of token display across different applications.

# Guide

Each token (and also NFT Collection) has its own metadata. It contains some info about token, such as title and associated image. Metadata can be stored offchain (smart contract will contain only a link to json) or onchain (all data will be stored in smart contract).

## NFT Collection metadata example (offchain)

Deployed in mainnet at address: `EQD7Qtnas8qpMvT7-Z634_6G60DGp02owte5NnEjaWq6hb7v` ([explorer.tonnft.tools](https://explorer.tonnft.tools/collection/EQD7Qtnas8qpMvT7-Z634_6G60DGp02owte5NnEjaWq6hb7v))

Metadata:
```json
{
   "image": "https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/image.png",
   "name": "TON Smart Challenge #2",
   "description": "TON Smart Challenge #2 Winners Trophy",
   "social_links": [],
   "marketplace": "getgems.io"
}
```

## NFT Item metadata example (offchain)

Deployed in mainnet at address: `EQA5q4UveXaw6zx359QtgYh1L6c18X0OiAcQPhlkXufwQjOA` ([explorer.tonnft.tools](https://explorer.tonnft.tools/nft/EQA5q4UveXaw6zx359QtgYh1L6c18X0OiAcQPhlkXufwQjOA))

Metadata:
```json
{
   "name": "TON Smart Challenge #2 Winners Trophy",
   "description": "TON Smart Challenge #2 Winners Trophy 1 place out of 181",
   "image": "https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/images/943e994f91227c3fdbccbc6d8635bfaab256fbb4",
   "content_url": "https://s.getgems.io/nft/b/c/62fba50217c3fe3cbaad9e7f/content/84f7f698b337de3bfd1bc4a8118cdfd8226bbadf",
   "attributes": []
}
```

## Jetton metadata example (offchain):

Deployed in mainnet at address: `EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw` ([ton.cx](https://ton.cx/address/EQD0vdSA_NedR9uvbgN9EikRX-suesDxGeFg69XQMavfLqIw))

Metadata:
```json
{
   "name": "Huebel Bolt",
   "description": "Official token of the Huebel Company",
   "symbol": "BOLT",
   "decimals": 9,
   "image_data": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDAuNTkgMjc2LjQ3Ij48ZGVmcz48c3R5bGU+LmF7ZmlsbDojMWQxZDFiO308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iYSIgZD0iTTQxLjcxLDQxLjM4cS0xLjMyLDI1LjM0LTEuMjYsNTAuNjlUNDIsMTQyLjc1cTEuNDQsMjUuMzIsNC4yNiw1MC41M3Q3LDUwLjRjMS4xMSw2LjcxLDEuODksMTMuNjgsNC40OSwyMCwyLjE0LDUuMjEsNS41MywxMC41NSwxMS4yMywxMi4yNSw2LjMsMS44OSwxMi4wNi0xLjYxLDE1LjczLTYuNTQsNC4xNS01LjU5LDYuMTctMTIuNzgsOC0xOS4zOSw0LjMtMTUuMzgsNi0zMS4zOCw2LjctNDcuMjkuNzItMTYuMzcuNTUtMzIuNzguNjQtNDkuMTZsLjI2LTUxLjY3LjI2LTUxLjY3LjA2LTEyLjczYzAtMy4yMS01LTMuMjItNSwwbC0uMjUsNTAuNDItLjI2LDUwLjQyYy0uMDgsMTYuNTIsMCwzMy0uMyw0OS41Ni0uMjMsMTUuNDYtLjg5LDMxLTMuNjMsNDYuMjZhMTQ3LjkyLDE0Ny45MiwwLDAsMS01Ljc2LDIyLjQzYy0xLjc3LDUuMDgtNC4xNCwxMS4yNC05LjE2LDEzLjk0LTQuNDMsMi4zOS04Ljc1LDAtMTEuMzEtMy43My0zLjI0LTQuNzUtNC40Ni0xMC40NC01LjQ0LTE2cS00LjMxLTI0LjM5LTcuMjktNDl0LTQuNjQtNDkuMjdxLTEuNjYtMjQuNjctMi00OS40M3QuNjEtNDkuNDhxLjI0LTYuMTIuNTYtMTIuMjRjLjE2LTMuMjEtNC44NC0zLjItNSwwWiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNDUuMyw0Mi4wOWE2Ni42Nyw2Ni42NywwLDAsMS0yOC41Mi02QTY2Ljc5LDY2Ljc5LDAsMCwxLDEwLjIsMzIuNmMtMS42Ni0xLTMuNzItMi4wOS00LjctMy44NC0xLjkzLTMuNDgsMi4wNi03LDQuNjYtOC43OGE2Mi41OSw2Mi41OSwwLDAsMSwxMi45MS02LjMzQTEwNS4zNiwxMDUuMzYsMCwwLDEsMzcuMzMsOS40OCwxOTkuNjYsMTk5LjY2LDAsMCwxLDY2Ljg3LDUuNjRjMjAuMTItMS4zOSw0MC44OS0xLDYwLjA1LDYsMy4zMSwxLjIsOSwyLjU1LDguNjcsNy0uMywzLjkxLTMuNTUsNy4yNy02LjQyLDkuNjItNi4zMiw1LjE2LTE0Ljg1LDcuMS0yMi43Myw4LjMxYTI4OSwyODksMCwwLDEtMzEuMjMsMi43NHEtMTYuNzUuNzItMzMuNTIsMC00LjItLjItOC4zNy0uNDhhMi41LDIuNSwwLDAsMCwwLDUsMzYwLjU0LDM2MC41NCwwLDAsMCw3MC44Mi0xLjg5YzktMS4xNiwxOC4zLTMsMjUuOTEtOC4xMiwzLjcyLTIuNTEsNy4zMS01Ljg4LDkuMTktMTBhMTIuNjIsMTIuNjIsMCwwLDAsMS4xNy03LjU5LDkuMjIsOS4yMiwwLDAsMC00LjI2LTUuOTFBMzcsMzcsMCwwLDAsMTI4Ljg4LDdjLTIuNTEtLjk0LTUuMDctMS43Ny03LjY1LTIuNWExMTYuMzcsMTE2LjM3LDAsMCwwLTE2LTMuMjIsMTgxLjE2LDE4MS4xNiwwLDAsMC0zMi45My0xQzUxLjE2LDEuMzksMjguODUsMy42NywxMC4wNywxNC4yLDYsMTYuNDgsMS41NiwxOS43OS4zLDI0LjU1QTguODQsOC44NCwwLDAsMCwxLjM4LDMxLjZhMTcuMzksMTcuMzksMCwwLDAsNS43Myw1QTcyLDcyLDAsMCwwLDM3LjQyLDQ2Ljc0YTY5LjE1LDY5LjE1LDAsMCwwLDcuODguMzVjMy4yMiwwLDMuMjMtNSwwLTVaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00NC4xNyw2NS40NmExNjkuNzksMTY5Ljc5LDAsMCwxLDU0LjE0LTguODJjMy4yMiwwLDMuMjItNSwwLTVhMTc0LjMzLDE3NC4zMywwLDAsMC01NS40Nyw5Yy0zLDEtMS43Myw1Ljg1LDEuMzMsNC44MloiLz48cGF0aCBjbGFzcz0iYSIgZD0iTTQ0LDc1Ljc2YzQuMTQsMS44Niw4LjQ0LDEuNDgsMTIuNzcuNTMsNC41LTEsOS0yLjEyLDEzLjQ2LTMuMTlMOTcuOSw2Ni41MmMzLjEzLS43NCwxLjgtNS41Ni0xLjMzLTQuODJMNzAuMzYsNjcuOTQsNTcuMzcsNzFjLTMuNC44MS03LjQ3LDEuOTMtMTAuODQuNDNhMi41OCwyLjU4LDAsMCwwLTMuNDIuODksMi41MiwyLjUyLDAsMCwwLC45LDMuNDJaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00Mi4zMiw4OS4yMmEzNTEuOSwzNTEuOSwwLDAsMCw1NC42Mi02LjQ5LDIuNTMsMi41MywwLDAsMCwxLjc1LTMuMDgsMi41NiwyLjU2LDAsMCwwLTMuMDgtMS43NSwzNDIuMiwzNDIuMiwwLDAsMS01My4yOSw2LjMyYy0zLjIxLjEzLTMuMjIsNS4xMywwLDVaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00Ny4yOSwxMDIuNjZRNzAuNzUsMTAwLjgzLDk0LDk3LjNhMi41LDIuNSwwLDAsMC0xLjMzLTQuODJxLTIyLjYsMy40Mi00NS40Miw1LjE4YTIuNTUsMi41NSwwLDAsMC0yLjUsMi41LDIuNTIsMi41MiwwLDAsMCwyLjUsMi41WiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNDQuNzIsMTE2LjE5QTY4LjU5LDY4LjU5LDAsMCwxLDU3LjEyLDExNGM0LjQ4LS40OCw5LS45MywxMy40My0xLjM5bDI2Ljc5LTIuNzVhMi41NywyLjU3LDAsMCwwLDIuNS0yLjUsMi41MiwyLjUyLDAsMCwwLTIuNS0yLjVsLTI3LjI4LDIuOGMtNC40Ny40Ni04Ljk0LjktMTMuNDEsMS4zOWE3NC40Miw3NC40MiwwLDAsMC0xMy4yNiwyLjM1Yy0zLjA4LjkyLTEuNzcsNS43NCwxLjMzLDQuODJaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00NC4zMSwxMjhsNDktNS4zNGEyLjU3LDIuNTcsMCwwLDAsMi41LTIuNSwyLjUxLDIuNTEsMCwwLDAtMi41LTIuNWwtNDksNS4zNGEyLjU3LDIuNTcsMCwwLDAtMi41LDIuNSwyLjUxLDIuNTEsMCwwLDAsMi41LDIuNVoiLz48cGF0aCBjbGFzcz0iYSIgZD0iTTQ0Ljc3LDE0MS4xNEEyMjkuNDMsMjI5LjQzLDAsMCwxLDk1LjMxLDEzM2MzLjIxLS4xNSwzLjIyLTUuMTUsMC01YTIzNS40MywyMzUuNDMsMCwwLDAtNTEuODcsOC4zMWMtMy4xLjg2LTEuNzgsNS42OCwxLjMzLDQuODJaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00Ni4zMywxNTIuMTdhMzY3LjY5LDM2Ny42OSwwLDAsMCw0OC43My05YzMuMTEtLjc5LDEuNzktNS42Mi0xLjMzLTQuODJhMzU3LjgzLDM1Ny44MywwLDAsMS00Ny40LDguNzgsMi41OCwyLjU4LDAsMCwwLTIuNSwyLjUsMi41MSwyLjUxLDAsMCwwLDIuNSwyLjVaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik00OCwxNjMuMTFsNDYuOTEtNy41NmEyLjUyLDIuNTIsMCwwLDAsMS43NS0zLjA4LDIuNTYsMi41NiwwLDAsMC0zLjA4LTEuNzRsLTQ2LjkxLDcuNTVhMi41MywyLjUzLDAsMCwwLTEuNzQsMy4wOEEyLjU2LDIuNTYsMCwwLDAsNDgsMTYzLjExWiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNDguNzQsMTc0YTE4Ny42OCwxODcuNjgsMCwwLDEsNDcuNTctNi4yN2MzLjIyLDAsMy4yMy01LDAtNWExOTMuNTksMTkzLjU5LDAsMCwwLTQ4LjksNi40NWMtMy4xMS44Mi0xLjc5LDUuNjUsMS4zMyw0LjgyWiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNDguMywxODYuOGEzNzEuOTMsMzcxLjkzLDAsMCwwLDQ1LjgtNi4zMywyLjUyLDIuNTIsMCwwLDAsMS43NC0zLjA3LDIuNTUsMi41NSwwLDAsMC0zLjA3LTEuNzVBMzYwLjIyLDM2MC4yMiwwLDAsMSw0OC4zLDE4MS44YTIuNTYsMi41NiwwLDAsMC0yLjUsMi41LDIuNTEsMi41MSwwLDAsMCwyLjUsMi41WiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNDguMjgsMTk5LjczUTcxLjgyLDE5Nyw5NSwxOTIuMTRhMi41MywyLjUzLDAsMCwwLDEuNzUtMy4wNywyLjU1LDIuNTUsMCwwLDAtMy4wOC0xLjc1UTcxLjE3LDE5Miw0OC4yOCwxOTQuNzNhMi41OCwyLjU4LDAsMCwwLTIuNSwyLjUsMi41MSwyLjUxLDAsMCwwLDIuNSwyLjVaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik01MiwyMTEuODlRNzQsMjA3LjYsOTYuMzIsMjA1YTIuNTcsMi41NywwLDAsMCwyLjUtMi41LDIuNTIsMi41MiwwLDAsMC0yLjUtMi41cS0yMywyLjYzLTQ1LjY3LDdhMi41MSwyLjUxLDAsMCwwLTEuNzUsMy4wN0EyLjU1LDIuNTUsMCwwLDAsNTIsMjExLjg5WiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNTMuMzMsMjI2LjIycTIwLjQtMS40LDQwLjY2LTQuMmEyLjUzLDIuNTMsMCwwLDAsMS43NS0zLjA4LDIuNTYsMi41NiwwLDAsMC0zLjA4LTEuNzRxLTE5LjU3LDIuNy0zOS4zMyw0YTIuNTUsMi41NSwwLDAsMC0yLjUsMi41LDIuNTIsMi41MiwwLDAsMCwyLjUsMi41WiIvPjxwYXRoIGNsYXNzPSJhIiBkPSJNNTcsMjM4LjExcTE2LjgxLTMuOTIsMzMuOTItNi40YTIuNTMsMi41MywwLDAsMCwxLjc1LTMuMDgsMi41OCwyLjU4LDAsMCwwLTMuMDgtMS43NXEtMTcuMDksMi40OS0zMy45Miw2LjQxYy0zLjEzLjczLTEuODEsNS41NSwxLjMzLDQuODJaIi8+PHBhdGggY2xhc3M9ImEiIGQ9Ik01OS4zMywyNDkuMjdBMjE2LjgyLDIxNi44MiwwLDAsMCw4OCwyNDUuMDdjMy4xNC0uNjgsMS44MS01LjUtMS4zMy00LjgyYTIwNS4yOSwyMDUuMjksMCwwLDEtMjcuMzYsNCwyLjU3LDIuNTcsMCwwLDAtMi41LDIuNSwyLjUxLDIuNTEsMCwwLDAsMi41LDIuNVoiLz48cGF0aCBjbGFzcz0iYSIgZD0iTTYyLjA5LDI2Mi41NmwyMi44NS0zLjg2YTIuNTEsMi41MSwwLDAsMCwxLjc1LTMuMDcsMi41NSwyLjU1LDAsMCwwLTMuMDctMS43NWwtMjIuODYsMy44NkEyLjUyLDIuNTIsMCwwLDAsNTksMjYwLjgxYTIuNTcsMi41NywwLDAsMCwzLjA4LDEuNzVaIi8+PC9zdmc+"
}
```

This example shows us that it is possible to embed an image directly in json, without additional links.

# Specification

## Content representation
Three options can be used:

1. **Off-chain content layout**
   The first byte is `0x01` and the rest is the URI pointing to the JSON document containing the token metadata. The URI is encoded as ASCII.
   If the URI does not fit into one cell, then it uses the "Snake format" described in the "Data serialization" paragraph, the snake-format-prefix `0x00` is dropped.
2. **On-chain content layout**
   The first byte is `0x00` and the rest is key/value dictionary.
   Key is sha256 hash of string.
   Value is data encoded as described in "Data serialization" paragraph.
3. **Semi-chain content layout**
   Data encoded as described in "2. On-chain content layout".
   The dictionary must have `uri` key with a value containing the URI pointing to the JSON document with token metadata.
   Clients in this case should merge the keys of the on-chain dictionary and off-chain JSON doc.

## Data serialization
Data that does not fit in one cell can be stored in two ways:

1. **Snake format** when we store part of the data in a cell and the rest of the data in the first child cell (and so recursively).
   Must be prefixed with `0x00` byte.
   TL-B scheme:
   ```
   tail#_ {bn:#} b:(bits bn) = SnakeData ~0;
   cons#_ {bn:#} {n:#} b:(bits bn) next:^(SnakeData ~n) = SnakeData ~(n + 1);
   ```
2. **Chunked format** when we store data in dictionary `chunk_index` -> `chunk`.
   Must be prefixed with `0x01` byte.
   TL-B scheme:
   ```
    chunked_data#_ data:(HashMapE 32 ^(SnakeData ~0)) = ChunkedData;
   ```

Data that fits into one cell is stored in "Snake format".

## Informal TL-B scheme:
```
text#_ {n:#} data:(SnakeData ~n) = Text;
snake#00 data:(SnakeData ~n) = ContentData;
chunks#01 data:ChunkedData = ContentData;
onchain#00 data:(HashMapE 256 ^ContentData) = FullContent;
offchain#01 uri:Text = FullContent;
```

Note, that while TL-B scheme does not constrain bit size of each chunk it is expected that all chunks contain ceil number of bytes.

## NFT metadata attributes
1. `uri` - Optional. Used by "Semi-chain content layout". ASCII string. A URI pointing to JSON document with metadata.
2. `name` - Optional. UTF8 string. Identifies the asset.
3. `description` - Optional. UTF8 string. Describes the asset.
4. `image` - Optional. ASCII string. A URI pointing to a resource with mime type image.
5. `image_data` - Optional. Either binary representation of the image for onchain layout or base64 for offchain layout.

## Jetton metadata attributes
1. `uri` - Optional. Used by "Semi-chain content layout". ASCII string. A URI pointing to JSON document with metadata.
2. `name` - Optional. UTF8 string. The name of the token - e.g. "Example Coin".
3. `description` - Optional. UTF8 string. Describes the token - e.g. "This is an example jetton for the TON network".
4. `image` - Optional. ASCII string. A URI pointing to a jetton icon with mime type image.
5. `image_data` - Optional. Either binary representation of the image for onchain layout or base64 for offchain layout.
6. `symbol` - Optional. UTF8 string. The symbol of the token - e.g. "XMPL". Used in the form "You received 99 XMPL".
7. `decimals` - Optional. If not specified, 9 is used by default. UTF8 encoded string with number from 0 to 255. The number of decimals the token uses - e.g. 8, means to divide the token amount by 100000000 to get its user representation, while 0 means that tokens are indivisible: user representation of token number should correspond to token amount in wallet-contract storage.
   In case you specify decimals, it is highly recommended that you specify this parameter on-chain and that the smart contract code ensures that this parameter is immutable.

# Drawbacks

Why should we *not* do this?

# Rationale and alternatives

- Why is this design the best in the space of possible designs?
- What other designs have been considered and what is the rationale for not choosing them?
- What is the impact of not doing this?

# Prior art

Discuss prior art, both the good and the bad, in relation to this proposal. How the problem stated in "Motivation" section was solved in another blockchains? This section encourages you as an author to learn from others' mistakes. Feel free to include links to blogs, books, Durov's whitepapers, etc.

# Unresolved questions

1. Shall we authenticate offchain data to prevent it from changing? ([NoelJacob](https://github.com/ton-blockchain/TIPs/issues/64#issuecomment-1029900008))
2. Shall we support semichain layout, where only some metadata fields may be stored onchain? ([tvorogme](https://github.com/ton-blockchain/TIPs/issues/64#issuecomment-1028622110))
3. Shall we standardize attributes, traits, and non-image content? ([tolya-yanot](https://github.com/ton-blockchain/TIPs/issues/64#issuecomment-1041919338))

# Future possibilities

Do you have ideas, which things can be implemented on top of this TEP later? Write possible ideas of new TEPs, which are related to this TEP.

# Changelog
* 14 May 2022 - the standard is now used not only for NFT, but for all tokens in the TON. Added section "Jetton metadata attributes".