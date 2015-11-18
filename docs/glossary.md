Glossary
--------

There's some internal jargon that we use which you might find floating around in our documentation from time to time. Here's what most of it means:

**Chain fork:** Forking public chains off into private chains is a core part of testing with Dapple. This allows you to test against the state of the blockchain your package will eventually be deployed to at any given height, giving you a 100% reproducible testing environment that can refer to the real addresses of real contracts. This also means your tests can run in parallel without inadvertantly changing the shared state each depends on and causing random failures.

**Chain context:** A set of named contract addresses within a single system or package. For each package there is a unique context per chain, for example one `eth` context and one `nexus-testnet` context. The simplest context example is one which defines where a universal `namereg` contract lives. In practice you will want to "dereference" contract addresses which you know are fixed to save on gas costs.

**Package path:** The location of a given package in the dependency hierarchy relative to your root package. Since each dependency in your package may rely on different versions and variations of the same package, each one keeps its own copy of its dependencies within its own directory. The path to the `core` package your package relies on is simply `core`, while the path to the `core` package <some other dependency> relies on is `<some other dependency>.core`.

