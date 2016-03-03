## Definitions

Last updated 0.2.0

#### basics

The term "contract" introduces ambiguity. We use the familiar terms "class" and "object" instead.

**class definition**: A Solidity "contract" definition (potentially any bit of code that can be deployed)

**classname** - a class (type) name used during compilation

**class header** - classname + the sol/js ABI for a class

**objectname** - the name of an address in an abstract contract system, like `my_root_registry`.

**object reference** - objectname + address.

**object header** - objectname + class header.

**object**: object reference and header.

#### system

**system variables**: A set of object headers.

**environment:**: A set of object references.

**context**: A mapping of system variables to an environment, defined as a union of
one or more other environments. For example, you might have a "working environment"
or an environment with no blockchain, but a context is associated with a specific
blockchain and a specific set of contracts.

**LINK(objectname) macro**: a preprocessor macro used in Solidity code.
It is populated with a unique dummy address by the dapple preprocessor.
You can think of using LINK as adding a special type of argument to
the constructor which can only be called at deploy time (by a key
and not an address).

**class template definition**: Any class definition that has a LINK macro.

**class template header**: A class header + metadata about LINKs (set of objectnames)


#### dev cycle

**build step**

A process that adds an object reference to environment



#### deploy

**deploy step**: An instruction that makes a change to a (staged package?) AND/OR the global network state

    * pending: dapple sent a transaction, but has not confirmed the action
    * complete: dapple has confirmed that the transaction had the intended effect and is permanent

**deploy script**: A sequence of deploy steps associated with a particular (workspace/environment?). 


#### chain management

**chain config** - A chain connection descriptor  (rpc config, datadir)

**chain** - Enough metadata to unambigously specify a blockchain database.
Two default chains are named `ethereum` and `localtestnet`.
Chains have a default chain config, but a chain might have multiple valid
chain config options (connect to the same network/blockchain through different connections).

#### not finalized

packfile vs dappfile (vs libfile?)


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
