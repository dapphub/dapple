`dapple`
===

`dapple` is a tool for Solidity developers to help build and manage complex contract systems on Ethereum-like blockchains.

Some features:

* Contracts are run through the `cog` preprocessor, which a few use cases:
    * Code generation (no generics in Solidity)
    * Singleton contracts (hard-code addresses for a particular chain context)
* `dapple test`: You write your Solidity tests in Solidity, not Javascript!
* `dapple do` reproducible deploy steps
* package system (a `pack` is solidity sources + chain contexts + some metadata)

Future plans:

* Work towards a contract package standard
* admin GUI based on universal-dapp


It was developed out of necessity and in a somewhat ad-hoc manner. The current state of the code reflects this, and it is not a fun time for outside devs yet. We'll hire you to fix that, though.
