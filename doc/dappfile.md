A `dappfile` is a description of a set of deployed smart contracts and/or a collection of contract type information.

In this context we call the deployed contracts "objects" and the set of objects the "environment",
to disambiguate from the the `contract` keyword in Solidity which defines what we will call a "class".

A dappfile can only be defined with respect to a blockchain (e.g. "ethereum" or "nexus-transient"),
**except** for the special case when the environment is empty. In this case the dappfile could be called a "code package" (`packfile`?).

The dappfile points to contract data (both class and object data) using IPFS hashes. A dappfile can be in "staging" mode, where its objects are editable (as opposed to append-only) and its class sources reside on on the local filesystem (your dev folder).

A `.dapp` bundle is used to distribute the "expanded" dappfile, which lets you access its contents without an IPFS gateway (eg in any old browser).
