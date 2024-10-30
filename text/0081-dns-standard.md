- **TEP**: [81](https://github.com/ton-blockchain/TEPs/pull/5)
- **title**: TON DNS Standard
- **status**: Active
- **type**: Contract Interface
- **authors**: [EmelyanenkoK](https://github.com/EmelyanenkoK), [Tolya](https://github.com/tolya-yanot)
- **created**: 25.06.2022
- **replaces**: -
- **replaced by**: -

# Summary

TON DNS is a service for translating human-readable domain names (such as `test.ton` or `mysite.temp.ton`) into TON smart contract addresses, ADNL addresses employed by services running in the TON Network (such as TON Sites), and so on.

# Motivation

While anybody might in principle implement such a service using the TON Blockchain, 
it is useful to have such a predefined service with a wellknown interface, 
to be used by default whenever an application or a service wants to translate human-readable identifiers into addresses.

# Guide

## Useful links
1. [Reference DNS smart contracts](https://github.com/ton-blockchain/dns-contract)
2. [DNS Auction](https://dns.ton.org/) ([source code](https://github.com/ton-blockchain/dns))
3. [ton.org documentation](https://ton.org/docs/#/web3/dns)
4. Tolya answers about TON DNS (ru) - [1](https://github.com/ton-blockchain/TEPs/commit/4a09bfc737823f09f05dfb7008eec7784543bb2b), [2](https://telegra.ph/Otvety-na-voprosy-o-TON-DNS-kanalu-Investment-kingyru-CHast-2-08-06), [3](https://telegra.ph/Otvety-na-voprosy-o-TON-DNS-kanalu-Investment-kingyru-CHast-3-08-09)

# Specification

## Domain names
TON DNS employs familiarly-looking domain names, consisting of a **UTF-8** encoded string **up to 126 bytes**, with different sections of the domain name separated by dots (".").

Bytes in range `0..32` (null character, control codes and space) inclusive are not allowed in domain names.

For instance, `test.ton` and `mysite.temp.ton` are valid TON DNS domains.

Technically, TON domains are case-sensitive, but TON apps and services convert all domains to lowercase before performing a TON DNS lookup in order to obtain case-insensitivity, so it makes no sense to register domains not in the lowercase.

Note that a particular smart contract implementation may impose additional name limits when creating subdomains (for example, to avoid similar characters to protect against phishing). But the `dnsresolve` get-method must support the domain names in the format described above.

## Domain internal representation
Internally, TON DNS transforms domain names as follows. First, a domain name is split into its components delimited by dot characters `.`. Then null characters are appended to each component, and all components are concatenated in reverse order. For example, `google.com` becomes `com\0google\0`.

## First-level domain
Currently, only domains ending in `.ton` are recognized as valid TON DNS domains.

This could change in the future. Notice, however, that it is a bad idea to define first-level domains coinciding with first-level domains already existing in the Internet, such as `.com` or `.to`, because one could then register a TON domain `google.com`, deploy a TON site there, create a hidden link to a page at this TON site from his other innocently-looking TON site, and steal `google.com` cookies from unsuspecting visitors.

## Resolving TON DNS domains
### Root DNS
First, the **root DNS smart contract** is located by inspecting the value of configuration parameter `#4` in a recent masterchain state. This parameter contains the 256-bit address of the root DNS smart contract inside the masterchain.

### dnsresolve
**Get-method**

Then a special get-method `dnsresolve` is invoked for the root DNS smart contract, with two parameters:

* The first parameter is a `CellSlice` with `8n` data bits containing the internal representation of the domain being resolved, where `n` is the length of the internal representation in bytes (at most 127).
* The second parameter is an unsigned 256-bit Integer containing the required `category`. Usually, category is sha256 hash of string. If the category is zero, then all categories are requested.

**Get-method result**

Get-method returns two values:

* The first is `8m`, the length (in bits) of the prefix of the internal representation of the domain that has been resolved, `0 < m <= n`.
* The second is a `Cell` with the TON DNS record for the required domain in the required category, or the root a `Dictionary` with 256-bit unsigned integer keys (categories) and values equal to the serializations of corresponding TON DNS records.

**Not resolved**

If this get-method fails, then the TON DNS lookup is unsuccessful.

If the domain cannot be resolved by the root DNS smart contract, i.e. if no non-empty prefix is a valid domain known to the smart contract, then `(0, null)` is returned.

In other words, `m = 0` means that the TON DNS lookup has found no data for the required domain. In that case, the TON DNS lookup is also unsuccessful.

**Resolved**

If `m = n`, then the second component of the result is either a `Cell` with a valid TON DNS record for the required domain and category, or a `Null` if there is no TON DNS record for this domain with this category.

In either case, the resolution process stops, and the TON DNS record thus obtained is deserialized and the required information (such as the type of the record and its parameters, such as a smart contract address or a ADNL address).

**Partial resolved**

Finally, if `m < n`, then the lookup is successful so far, but only a partial result is available for the `m`-byte prefix of the original internal representation of the domain.

The longest of all such prefixes known to the DNS smart contract is returned. For instance, an attempt to look up `mysite.test.ton` (i.e. `ton\0test\0mysite\0` in the internal representation) in the root DNS smart contract might return `8m=72`, corresponding to prefix `ton\0test\0`, i.e. to subdomain `test.ton` in the usual domain representation.

In that case, `dnsresolve()` returns the value for category `sha256("dns_next_resolver")` for this prefix regardless of the category originally requested by the client. By convention, category `sha256("dns_next_resolver")` contains a TON DNS Record of type `dns_next_resolver`, containing the address of next resolver smart contract (which can reside in any other workchain, such as the basechain).

If that is indeed the case, the resolution process continues by running get-method `dnsresolve` for the next resolver, with the internal representation of the domain name containing only its part unresolved so far (if we were looking up `ton\0test\0mysite\0`, and prefix `ton\0test\0` was found by the root DNS smart contract, then the next `dnsresolve` will be invoked with `mysite\0` as its first argument).

Then either the next resolver smart contract reports an error or the absence of any records for the required domain or any of its prefixes, or the final result is obtained, or another prefix and next resolver smart contract is returned. In the latter case, the process continues in the same fashion until all of the original domain is resolved.

**Null character at the beginning**

Null character `\0` at the beginning of the request represent "self".

Calling the `dnsresolve` method with one null character `\0` ("." in human-readable form) and category is correct.

In this case, the DNS smart contract can return the requested category(-ies) from its DNS records.

Example:

`dnsresolve("ton\0test\0mysite\0", 1)` is invoked for the root DNS smart contract.

Result is `8m=64`, corresponding to prefix `ton\0test`, and `dns_next_resolver` record.

`dnsresolve("\0mysite\0", 1)` is invoked for the DNS smart contract obtained from `dns_next_resolver` record.

Result is `8m=56`, corresponding to prefix `\0mysite`, and `dns_next_resolver` record.

`dnsresolve("\0", 1)` is invoked for the DNS smart contract obtained from `dns_next_resolver` record.

Result is `8m=8`, corresponding to `\0` and Cell with DNS record of category 1.

**Calling a `dnsresolve` on a non-root DNS smart contract**

Same with the `dnsresolve` on root DNS smart contract, but the initial request must start with a null character so that all types of implementations can return the correct result.

Example: `dnsresolve("\0test\0mysite\0")`.

Note that this is only required for the initial request, not during recursion.

## DNS Smart Contract
A smart contract that implements the TON DNS standard must contain a `dnsresolve` get-method that works as described above.

## DNS Records
Standard categories:

Category `sha256("dns_next_resolver")` - DNS next resolver, contains smart contract address of next DNS resolver in `dns_next_resolver` schema;

Category `sha256("wallet")` - TON Wallet, contains smart contract address in `dns_smc_address` schema;

Category `sha256("site")` - TON Site, contains ADNL address in `dns_adnl_address` schema;

TL-B Schema of DNS Records values:

```
proto_http#4854 = Protocol;
proto_list_nil$0 = ProtoList;

proto_list_next$1 head:Protocol tail:ProtoList = ProtoList;



cap_is_wallet#2177 = SmcCapability;

cap_list_nil$0 = SmcCapList;
cap_list_next$1 head:SmcCapability tail:SmcCapList = SmcCapList;

dns_smc_address#9fd3 smc_addr:MsgAddressInt flags:(## 8) { flags <= 1 }
  cap_list:flags . 0?SmcCapList = DNSRecord;
dns_next_resolver#ba93 resolver:MsgAddressInt = DNSRecord;
dns_adnl_address#ad01 adnl_addr:bits256 flags:(## 8) { flags <= 1 }
  proto_list:flags . 0?ProtoList = DNSRecord;
dns_storage_address#7473 bag_id:bits256 = DNSRecord;

_ (HashmapE 256 ^DNSRecord) = DNS_RecordSet;
```

# Drawbacks

None

# Rationale and alternatives

## Why domains are so expensive?
Without minimal price, it is possible to buy all 4-letters domains (26^4 = ~457000) for several tens of thousands TON. So, minimal price depends on the length of domain name. It is also worth noting that after a few months minimal price for all domains will decrease to 100 TON.

## Why DNS auction burns coins?
If we will not burn coins from DNS auctions, then, who we will need send money to?

## Why only ASCII domains are allowed?
If we support UTF-8, it would be possible to create domains which will look same, but still will be different domains (example.ton and ехаmрlе.ton).

## Why there is resolver for subdomains? 
It is possible to implement any logic for subdomains in custom resolver contract.

## Why domains are not bought forever?
There is a possibility that access to wallet which owns a domain will be lost, so domain will be lost forever. In TON DNS, it is required to prolong domains each year by sending at least 0.005 TON (minimal amount of TONs for message to be processed) to the contract.

# Prior art

1. [EIP-137](https://eips.ethereum.org/EIPS/eip-137)

# Unresolved questions

None

# Future possibilities

1. Implement private (encrypted) fields

# Changelog

* 20 Dec 2023 - deleted unused capabilities:
  
   ```
   cap_method_seqno#5371 = SmcCapability;
   cap_method_pubkey#71f4 = SmcCapability;
   cap_name#ff name:Text = SmcCapability;
   ```
