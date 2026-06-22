- **TEP**: [175](https://github.com/ton-blockchain/TEPs/pull/175) *(don't change)*
- **title**: TON Connect Universal Bridge
- **status**: Proposed
- **type**: Core
- **authors**: [@thekiba](https://github.com/thekiba), [@mr-tron](https://github.com/mr-tron)
- **created**: 19.07.2024
- **replaces**: -
- **replaced by**: -

# Summary

This TEP proposes adding a universal bridge to TON Connect to reduce load on individual wallet bridges and improve scalability. The universal bridge will handle the initial connection event and then the dapp will switch to the wallet-specific bridge as needed.

# Motivation

The current TON Connect specification requires dapps to open connections to all wallet bridges when displaying a universal QR code or link for connection. This causes several issues:

1. Unnecessary load on smaller wallet bridges from connections that may not be used.
2. Potential to hit browser limits on open connections.
3. Inefficient use of resources, especially for dapps with many users.
4. Slower initial connection process due to multiple simultaneous connections.

A universal bridge would address these issues while maintaining compatibility with existing wallets and preserving the user experience.

# Guide

This TEP introduces a universal bridge that acts as an intermediary for the initial connection process when using universal QR codes or links. The workflow will be as follows:

1. Dapps connect only to the universal bridge when showing a universal QR code or using a universal link.
2. The wallet sends the initial connect event to the bridge specified in the connection request, or to its default bridge if none is specified.
3. The universal bridge handles the initial connect event and notifies the dapp.
4. The dapp receives the connect event, which includes information about which wallet was used for connection.
5. The dapp retrieves the wallet-specific bridge URL from the wallets list, as it does currently.
6. The dapp switches to the wallet-specific bridge for all subsequent communication.

This approach reduces unnecessary connections while maintaining the existing workflow for users and wallets.

Key points:
- The universal bridge is only used for the initial connection process.
- After the initial connection, all communication occurs directly between the dapp and the wallet-specific bridge.

# Specification

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## Universal Bridge

The universal bridge SHALL be implemented identically to existing TON Connect bridges, with no functional differences:

1. Accepts connections from clients (both dapps and wallets) using the existing TON Connect protocol.
2. Maintains separate message queues for each client's ID.
3. Forwards encrypted messages between clients without knowledge of the message contents.
4. Implements the same security measures and protocols as existing bridges.

The key distinction is not in the bridge's implementation, but in how it's used within the TON Connect ecosystem. It will serve as the initial connection point for dapps using universal QR codes or links, thereby reducing the need for multiple simultaneous connections to various wallet-specific bridges.

## Connect Link and Request

The format of the connect link SHALL remain unchanged, but the ConnectRequest type SHALL be updated to include an optional `bridge` parameter:

```typescript
type ConnectRequest = {
  manifestUrl: string;
  items: ConnectItem[], 
  bridge?: string; // Optional URL of the universal bridge to use
}
```

If no bridge parameter is provided in the ConnectRequest, the wallet-specific bridge SHALL be used.

## Wallet Behavior

1. Wallets MUST check for the presence of a bridge parameter in the ConnectRequest.
2. If a bridge parameter is present, wallets MUST send the initial connect event to the specified bridge.
3. If no bridge parameter is present, wallets MUST send the initial connect event to their default bridge.

## Dapp Behavior for Universal QR Code or Link

1. For a period of 6 months after the approval of this TEP, when using a universal QR code or link, dapps MUST connect to both the universal bridge and wallet-specific bridges for backwards compatibility.
Upon receiving a connect event:
  * If the event came through the universal bridge, dapps MUST extract the wallet information, retrieve the corresponding wallet-specific bridge URL from the wallets list, and switch to that bridge for further communication.
  * If the event came through a wallet-specific bridge, dapps MUST continue using that bridge for communication.
2. After the 6-month transition period, when using a universal QR code or link, dapps MUST connect only to the universal bridge.

Note: This behavior applies only to universal QR codes or links. For cases where the dapp knows the specific wallet in advance, the existing connection method to the wallet-specific bridge should be used.

## Transition Period

1. Wallet developers MUST update their wallets to support the universal bridge within 6 months after the approval of this TEP.
2. During this 6-month period, dapps MUST maintain connections to both the universal bridge and wallet-specific bridges for backwards compatibility.
3. After the 6-month period, dapps are not guaranteed to connect to all bridges simultaneously, potentially affecting non-updated wallets.
4. Dapps MAY continue supporting connections to wallet-specific bridges after the transition period, but it's not mandatory.

# Drawbacks

While the universal bridge approach solves several issues, there are some potential drawbacks:

1. Additional complexity in the overall system architecture.
2. Potential single point of failure if the universal bridge experiences issues.
3. Requires updates to existing wallets and bridges for full compatibility.
4. Slight increase in latency for the initial connection process due to an additional hop through the universal bridge.

# Rationale and alternatives

This design is the best in the space of possible designs because:
  1. It significantly reduces the number of simultaneous connections that dapps need to maintain, addressing the main scalability issue.
  2. It maintains backwards compatibility with existing wallets and bridges.
  3. It preserves the current user experience and workflow.
  4. It allows for easier management and scaling of the bridge infrastructure.

Alternative designs considered:
  1. Implementing a distributed bridge system without a central universal bridge. This would be more complex to implement and manage, and could lead to inconsistent behavior across the ecosystem.
  2. Requiring all wallets to implement a standard API for direct connections. This would require significant changes to existing wallets and break backwards compatibility.

The impact of not implementing this change:
  1. Dapps would continue to face potential issues with browser connection limits.
  2. Smaller wallet bridges would continue to experience unnecessary load from unused connections.
  3. The TON Connect ecosystem would face scalability challenges as the number of wallets and users grows.

This solution provides the best balance between solving the current issues, maintaining compatibility, and setting a foundation for future improvements in the TON Connect protocol.

# Prior art

While the concept of a universal bridge is somewhat unique to TON Connect, similar concepts exist in other ecosystems. E.g. WalletConnect v2 uses a central relay server to facilitate connections between dapps and wallets.

These solution address similar issues of simplifying and optimizing the connection process between dapps and wallets.

# Unresolved questions

1. How will the URL of the universal bridge be distributed and updated across the ecosystem?
2. What is the optimal way to handle load balancing for the universal bridge to ensure high availability?
3. How will we measure and monitor the performance improvements from this change?

# Future possibilities

With the implementation of this update, dapp projects will already have the ability to specify the URL of the universal bridge when forming a connection request. This will allow large projects to use their own universal bridges for handling connections.
