- **TEP**: [0](https://github.com/ton-blockchain/TEPs/pull/0) *(don't change)*
- **title**: Web3 provider javascript API
- **status**: Draft
- **type**: Core
- **authors**: [XTON wallet team](https://github.com/xtonwallet)
- **created**: 19.12.2022
- **replaces**: [TEP-0](https://github.com/ton-blockchain/TEPs/blob/master/0000-template.md)
- **replaced by**: -

# Summary

A JavaScript Web3 Provider API for consistency across clients and applications.
A common convention in the TON blockchain web application (“DApp”) ecosystem is for key management software (“wallets”) to expose their API via a JavaScript object in the web page. This object is called “the Provider”.
The Provider implementations can have conflicting interfaces and behaviors between wallets. This TEP formalizes an Web3 Provider API to promote wallet interoperability. The API is designed to be minimal, event-driven, and agnostic of transport. Its functionality is easily extended by defining new methods and message event types.
Offer for all providers to make available their features as window.ton in web browsers for uniformity.

# Motivation

This proposal sets as the main aim to work out an agreement for the Web3 provider interface to avoid any artificial situation when DApp developers can be forced to use only the one wallet on the market or implement integration for many solutions. Offer to introduce the uniform Web3 provider interface allows users using any wallet solution for decentralized applications (DApp) interaction aims.

# Guide

This specification describes uniform Web3 interface that can use DApp developers. It will save many hours on the development process, because only "wallets" developers will spend a time for an intergation own solution by this specification the once. This approach also works on other blockchains, for example Metamask team offered a specification by uniform Web3 interface. This proposal also is built by the same scheme.

# Specification

> The key words “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, and “OPTIONAL” in this document are to be interpreted as described in RFC 2119.

## Glossary

Provider - A JavaScript object made available to a consumer, that provides access to TON blockchain by means of a Client.

Client - An endpoint that receives requests from the Provider, and returns their results.

Wallet - An end-user application that manages private keys, performs signing operations, and acts as a middleware between the Provider and the Client.

Remote Procedure Call (RPC) - A Remote Procedure Call (RPC), is any request submitted to a Provider for some procedure that is to be processed by a Provider, its Wallet, or its Client.

## Versions

For backwards compatibility and extension of this API, “wallets” MUST have a property on the `windows.ton` object prefixed with `isTEPs` and PR number. For example, for this the PR number is 105, then `windows.ton.isTEPs105` MUST return `true` if the full API specification is implemented by “wallet”.

## Request

```
    interface RequestArguments {
        readonly method: string;
        readonly params?: readonly unknown[] | object;
    }

    Provider.request(args: RequestArguments): Promise<unknown>;
```

The Provider must identify the requested RPC method by the value of RequestArguments.method. This method name MUST adhere the format `prefix_functionName`, where prefix always MUST be `ton`, functionName is a name of function from the the documentation. For example: “ton_account” RequestArguments.method will return to the DApp selected account.
If the requested RPC method takes any parameters, the Provider MUST accept them as the value of RequestArguments.params.
RPC requests MUST be handled such that the returned Promise either resolves with a value per the requested RPC method’s specification, or rejects with an error.
If resolved, the Promise MUST resolve with a result per the RPC method’s specification. The Promise MUST NOT resolve with any RPC protocol-specific response objects, unless the RPC method’s return type is so defined.
If the returned Promise rejects, it MUST reject with a ProviderRpcError as specified in the RPC Errors section below.
The returned Promise MUST reject if any of the following conditions are met:
* An error is returned for the RPC request.
* If the returned error is compatible with the ProviderRpcError interface, the Promise MAY reject that error directly.
* The Provider encounters an error or fails to process the request for any reason.

Supported RPC Methods

```
interface ProviderRpcResult {
  code: number;
  data: unknown;
}
```

A “supported RPC method” is any RPC method that may be called via the Provider.
All supported RPC methods MUST be identified by unique strings.
Providers MAY support whatever RPC methods required to fulfill their purpose, standardized or otherwise.
Methods are RECOMMENDED to name in the format `prefix_functionName`, where “prefix” MUST be always `ton` and functionName must be string in camelCase naming convention. For example: `ton_subscribe`, `ton_signMessage`
The predefined list of used function names is placed in Appendix I: Used function names.
The user MUST confirm any action that demands interaction with the private keys.
If an RPC method returns a result without any errors, the code MUST be 4000. If an RPC method returns any  errors as a result, then it SHOULD be rejected with a 4300 error per the Provider Errors section below, or an appropriate error per the RPC method’s specification.
If an RPC method defined in a finalized TEPs is not supported, it SHOULD be rejected with a 4200 error per the Provider Errors section below, or an appropriate error per the RPC method’s specification.

## RPC Errors

```
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}
```

message
* MUST be a human-readable string
* SHOULD adhere to the specifications in the Error Standards section below
code
* MUST be an integer number
* SHOULD adhere to the specifications in the Error Standards section below
data
* SHOULD contain any other useful information about the error
  
## Error Standards

ProviderRpcError codes and messages SHOULD follow these conventions, in order of priority:
* The errors in the Provider Errors section below
* Any errors mandated by the erroring RPC method’s specification
* The CloseEvent status codes

### Provider Errors

| Status code | Name | Description |
|-------------|------|-------------|
| 4001 | User Rejected Request	| The user rejected the request. |
| 4100 | Unauthorized | The requested method and/or account has not been authorized by the user. |
| 4200 | Unsupported Method | The Provider does not support the requested method. |
| 4201 | Wrong parameters| The Provider supports the requested method, but with other parameters. |
| 4300 | Method error | The Provider has run the requested method but the result is the error. |

## Subscriptions

If the Provider supports TON RPC subscriptions, e.g. `ton_subscribe`, the Provider MUST emit the message event when it receives a subscription notification.
If the Provider receives a subscription message from e.g. an `ton_subscribe` subscription, the Provider MUST emit a message event with a ProviderMessage object of the following form:

```
interface TonSubscription extends ProviderMessage {
  readonly type: 'ton_subscription';
  readonly subscriptionId: string;
  readonly data: unknown;
}
```

## Events

The Provider MUST implement the following event handling methods:
* on
* off
These methods MUST be implemented per the Node.js EventEmitter API.
 
### message

When emitted, the message event MUST be emitted with an object argument of the following form:

```
interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}
```

### endpointChanged

If the endpoint the Provider changes, the Provider MUST emit the event named `endpointChanged` with value endpoint: string, specifying the URL of the new endpoint.

### accountChanged

If the account is available in the Provider, the Provider MUST emit the event named `accountChanged` with value account: string, containing the new account address.

### unlockStateChanged

If the wallet is ready to use with the Provider, the Provider MUST emit the event named `unlockStateChanged` with value state: boolean, containing the state of wallet - locked or not.

### Rationale

The purpose of a Provider is to provide a consumer with access to TON blockchain. In general, a Provider must enable an TON web application to do two things:
* Make TON RPC requests
* Respond to state changes in the Provider’s TON endpoint, Client, and Wallet

The Provider API specification consists of a single method and four events. The request method and the message event alone, are sufficient to implement a complete Provider. They are designed to make arbitrary RPC requests and communicate arbitrary messages, respectively.
Common Client and/or Wallet state changes that any non-trivial application must handle
* message
* endpointChanged
* accountChanged
* unlockStateChanged

These events are included due to the widespread production usage of related patterns, at the time of writing.

## Security Considerations

The Provider is intended to pass messages between a TON Client and an TON application. It is not responsible for private key or account management; it merely processes RPC messages and emits events. Consequently, account security and user privacy need to be implemented in middlewares between the Provider and its TON Client. In practice, we call these middleware applications “Wallets” and they usually manage the user’s private keys and accounts. The Provider can be thought of as an extension of the Wallet, exposed in an untrusted environment, under the control of some third party (e.g. a website).

### Handling Adversarial Behavior

Since it is a JavaScript object, consumers can generally perform arbitrary operations on the Provider, and all its properties can be read or overwritten. Therefore, it is best to treat the Provider object as though it is controlled by an adversary. It is paramount that the Provider implementer protects the user, Wallet, and Client by ensuring that:
* The Provider does not contain any private user data.
* The Provider and Wallet programs are isolated from each other.
* The Wallet and/or Client rate-limit requests from the Provider.
* The Wallet and/or Client validate all data sent from the Provider.

### Endpoint Changes

Since all TON operations are directed at a particular endpoint, it’s important that the Provider accurately reflects the Client’s configured endpoint.
This includes ensuring  that the `endpointChanged` event is emitted whenever that value changes.

### User Account Exposure and Account Changes

Many TON operations (e.g. `ton_sendTrasaction`) require a user account to be specified. Provider consumers access their own accounts via the `ton_account` RPC method, and by listening for the `accountChanged` event.
It is critical that `ton_account` has the correct return value, and that the `accountChanged` event is emitted whenever that value changes.
The return value of `ton_account` is ultimately controlled by the Wallet or Client. In order to protect user privacy, this document recommends not exposing accounts by default. Instead, Providers SHOULD support RPC methods for explicitly requesting account access, such as `ton_requestPermissions`.

# Appendix I: Used function names

As was introduced before in accordingly with the function naming, functions MUST use format `prefix_functionName`, some predefined list of such functions presents below:

## wallet_getSdkVersion

function that SHOULD be used by dApp for getting the SDK version that uses by provider.

## wallet_requestPermissions

function that SHOULD be used by dApp for getting the permission from the wallet to work with RPC. The wallet MUST show a popup to get the confirmation from the user on allowing interaction between the wallet and dApp from which the request was received. `params` for this method is an array with the list of permissions that the user will grant to the dApp. Each permission MUST be a valid RPC method name. All supported by the wallet methods MUST have a description that will allow the user to understand which type of access will be granted. The methods that will contain the potential using of private keys MUST be highlighted.

## wallet_getPermissions

function that SHOULD be used by dApp for getting an array of current permissions (empty by default).

## ton_endpoint

function that SHOULD return the current endpoint if the Provider is connected. `params` for this method are empty.

## ton_account

function that SHOULD return the current account address and public key that is used in the wallet. This method MUST be under the permissions mechanism protection. `params` for this method are empty.

## ton_subscribe

function that SHOULD be used by dApp for a subscription on blockchain events. Method MUST return subscriptionID that can be used to track the events for this subscription. `params` for this method is account address as string.

## ton_unsubscribe

function that SHOULD be used by dApp for an unsubscription on blockchain events. `params` for this method is account address from `ton_subscribe` as string.

## ton_sendTransaction

function that SHOULD be used by dApp for a sending transaction from wallet to destination with amount and message. `params` for this method are destination as string, token (can be “native” to send `TONCOIN` or token root address to send tokens) as string, amount as number, message as string.

## ton_sendRawTransaction

function that SHOULD be used by dApp for a deploying something or interacting with smart contract. `params` for this method are to as string, amount as number, data as string, dataType as string (can be "text", "hex", "base64", "boc"), stateInit as string (only boc).

## ton_signMessage

function that SHOULD be used by dApp for a receiving signature of data based on the signing box of the current account. `params` for this method is a data as string.

## ton_getSignature

function that SHOULD be used by dApp for a signature getting of a message based on the secret key of the current account. `params` for this method is a data as string.

## ton_getNaclBoxPublicKey

function that SHOULD be used by dApp for getting the public key for nacl box.

## ton_encryptMessage

function that SHOULD be used by dApp for a receiving encoded message based on the Receiver's public key and the private key of the current account. `params` for this method are decrypted as string, nonce as string, their_public as string. Nonce can be obtained from random bytes generation with length 24, their_public can be obtained from `ton_getNaclBoxPublicKey` (the Nacl public recipient key)

## ton_decryptMessage

function that SHOULD be used by dApp for a receiving encoded message based on the Sender's public key and the private key of the current account. params for this method are encrypted as string, nonce as string, their_public as string. Nonce must be the same as for `ton_encryptMessage` method, their_public can be obtained from ton_getNaclBoxPublicKey (the Nacl public sender key)

# Appendix II: Consumer-Facing API Documentation

## Request

Make a TON RPC method call.

```
interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}
Provider.request(args: RequestArguments): Promise<unknown>;
```

The returned Promise resolves with the method’s result or rejects with a ProviderRpcError. For example:

```
Provider.request({ method: 'ton_account' })
  .then((account) => console.log(account))
  .catch((error) => console.error(error));
```

Consult each TON RPC method’s documentation for its params and return type. You can find a list of common methods here.

### Events
 
#### endpointChanged

The Provider emits `endpointChanged` when connecting to a new endpoint.

```
Provider.on('endpointChanged', listener: (endpoint: string) => void): Provider;
```

The event emits a URL string endpoint.

#### accountChanged

The Provider emits `accountChanged` if the account returned from the Provider change.

```
Provider.on('accountChanged', listener: (account: string) => void): Provider;
```

The event emits an account address.

#### unlockStateChanged

The Provider emits `unlockStateChanged` if the wallet unlock state changes.

```
Provider.on('unlockStateChanged', listener: (unlockState: boolean) => void): Provider;
```

The event emits boolean value.

#### message

The Provider emits messages to communicate arbitrary messages to the consumer. Messages may include JSON-RPC notifications, and/or any other event as defined by the Provider.

```
interface ProviderMessage {
  readonly type: string;
  readonly data: unknown;
}
Provider.on('message', listener: (message: ProviderMessage) => void): Provider;
```

#### Subscriptions

`ton_subscription` method relies on this event to emit subscription updates.
For e.g. `ton_subscribe` subscription updates, ProviderMessage.type will equal the string `ton_subscription`, and the subscription data will be the value of ProviderMessage.data.

#### Errors

```
interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}
```

# Appendix III: Examples

These examples assume a web browser environment.

```
// Most Providers are available as window.ton on page load.
// This is only a convention, not a standard, and may not be the case in practice.
// Please consult the Provider implementation's documentation.
const ton = window.ton;
// Example 1: Log endpoint
ton
  .request({ method: 'ton_endpoint' })
  .then((endpoint) => {
    console.log(`URL string: ${endpoint}`);
  })
  .catch((error) => {
    console.error(`Error fetching endpoint: ${error.code}: ${error.message}`);
  });
// Example 2: Log available account
ton
  .request({ method: 'ton_account' })
  .then((account) => {
    console.log(`Account:\n${JSON.stringify(account)}`);
  })
  .catch((error) => {
    console.error(
      `Error fetching account: ${error.message}.
       Code: ${error.code}. Data: ${error.data}`
    );
  });
// Example 3: Log when account change
const logAccount = (account) => {
  console.log(`Account:\n${account}`);
};
ton.on('accountChanged', logAccount);
// to unsubscribe
ton.off('accountChanged', logAccount);
```

# Drawbacks

The current "wallets" solutions have own implementation Web3 interface that can't be extended by this standard. But they can implement both standards.

# Rationale and alternatives

This design is used by already existed solutions on other blockchains and passed validation many times

# Prior art

[EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
[EIP-2255: Wallet Permissions System](https://eips.ethereum.org/EIPS/eip-2255)

# Unresolved questions

How all existed "wallets" solutions will  implement this uniformed Web3 interface?

# Future possibilities

Possible to extend this standard by adding possibility to use some SDK methods. For example, DApp will be able to use Builder/Slice/BitString objects to compose boc.
