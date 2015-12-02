dapple vm tests are written in Solidity and are run in an EVM.
The EVM's logging capability is used to capture debug information and failure events.

You can generate a new contract and an associated VM test using `dapple new Example`.

`dapple test` will find run vm tests on all contracts that inherit `Test`.
For each `test*` function on each test contract, `dapple` will instantiate a new
instance of the contract in a local EVM, call `setUp()`, then call the `test` function.
