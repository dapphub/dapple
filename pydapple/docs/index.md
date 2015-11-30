# Dapple 

`dapple` helps Solidity developers build and manage complex contract systems on Ethereum blockchains.

Some features:

* Contracts are run through the `cog` preprocessor, which has a few use cases:
    * "generic" functions
    * Singleton contracts (hard-code addresses for a particular chain context)
* A plugin system that allows developers to override almost any aspect of Dapple's behavior.
* `dapple test`: You write your Solidity tests in Solidity, not Javascript!
* `dapple build`: Compile your smart contract package and display the output as JSON.
* `dapple install`: Install smart contract packages from a global smart package repository on IPFS.
* `dapple publish`: Publish your smart contract package to IPFS for others to use.
* `dapple do` reproducible deploy steps
* package system (a `pack` is solidity sources + chain contexts + some metadata)

Future plans:

* Work towards a contract package standard
* admin GUI based on universal-dapp

Source code can be found up on [Github](https://github.com/NexusDevelopment/dapple).
