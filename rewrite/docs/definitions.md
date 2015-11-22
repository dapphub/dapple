dappfile vs dapp header


### Definitions:

**class**: A Solidity "contract" definition (potentially any bit of code that can be deployed)

**classname** - a class (type) name used during compilation. 

**class header** - classname + the sol/js ABI for a class

**objectname** - a compile-time name of a fixed address

**object**: objectname + address

**object header** - object + class header

**chain config** - A chain connection descriptor  (rpc config, datadir)

**chain** - Enough metadata to unambigously specify a blockchain database. Two default chains are named `ethereum` and `localtestnet`. Chains are stored with a single chain config, but a chain might have multiple valid chain config options (connect to the same network/blockchain through different connections).

**deploy step**: An instruction that makes a change to a (staged package?) AND/OR the global network state

    * pending: dapple sent a transaction, but has not confirmed the action
    * complete: dapple has confirmed that the transaction had the intended effect and is permanent

**deploy script**: A sequence of deploy steps associated with a particular (workspace/environment?). 

#### not finalized
**chain context**: A set of named addresses (possibly null/undefined) for a given blockchain.

**contract sources**: A set of Solidity source files.

**package**: collection of contract sources with a chain context, name, version, and list of dependencies.

**bound package**: A package with all named addresses defined.

**unbound package**: A package with at least one undefined named address.

**staged package**: A package whose chain context can be modified.

**complete package**: A package that can be bound with the result of the deploy script of a collection of some dependent package

**system instance**: The set of objects named by the chain context of a deployed system type.


A package will typically ship a dev deploy sequence which will create a chain context which mocks the
one deployed on Ethereum.
