# Usage Proposal

The below is an attempt at combining Ryan and Nikolai's usage proposals in an
intelligent manner. Denis will be modifying and making suggestions to this
document.

I have rewritten the command examples using [Docopt](http://docopt.org/)'s
notation, as it is more widely known than the ad-hoc regex-ish notation I had
come up with on the fly.

# Preface

A simplifying constraint central to Dapple, which one should keep in mind while
reading the rest of this document, is that all test chains are derived from the
live mainnet chain. We made this choice because we realized that having multiple
packages with multiple environments defined could really make development
complicated and difficult, especially once deploy scripts and libraries enter
the mix.

As blockchain developers, we ought to be able to refer to libraries that have
been deployed to the blockchain without having to deploy our own versions each
time we run our tests. And we ought to be able to have a development environment
that reflects the global, stateful environment our contracts will eventually
have to live in. Furthermore, we ought to be able to use smart contract packages
without having to worry much about the various environmental vagaries each
dependency in our dependency chain might have relied on. Having a standardized,
shared environment helps keep manageable the potentially unmanageable complexity
of our shared smart contract dependency graphs.

# Jargon

We like to have words for specific concepts in this space, and some of these may
not be immediately intuitive. Definitions for our perhaps-unusual use of
language may be found in the [definitions](#Definitions) section of this
document.

# Installation

Upon installation (`npm -g install dapple`), the user is prompted for the
configuration values necessary to fill in the `default` environment in their
`.dapplerc` file. Sensible defaults are provided for people who want to just
speed through the prompts.

Also checks for IPFS and geth installations and warns the user if neither is
found. While Dapple can run without local instances of either, it's best if they
have their own copy of both.

# Configuration

## .dapplerc

Dapple creates a `.dapplerc` file in the user's home directory on installation.
This file contains all settings specific to the user's development environment,
such as connection parameters for IPFS. Chain environments may also be specified
here, each with its own group of settings.

If no chain environments are specified in this file, Dapple will attempt to
connect to Ethereum via its internal ethereumjs client. The internal ethereumjs
client may also be specified by mapping a chain environment name to the string
"internal" rather than to a map of Ethereum JSON-RPC settings.

The chain environment named "default" gets used if no chain environment is
specified while running any of Dapple's commands. This environment name is
reserved for internal and JSON-RPC chains only. Private test chains may not be
named "default."

## dappfile

Each Dapple package contains a `dappfile` which contains any settings specific
to the package itself, such as definitions of object addresses. In development,
object addresses references in the package source code may be left undefined.
However, all object address references must be bound before the package can be
published. The `deploy` command can assist with this.

# Commands

By default, all commands write their output to stdout on success. On failure,
an error is written to stderr and the command exits with a non-zero code.

Each command operates on the package defined in the current working directory,
if any such package is indeed defined. If no package is defined in the current
working directory, it returns an error.

```
Usage:
    dapple init
    dapple install [-e <environment>] <name or IPFS hash> [-v <version>] [--save]
    dapple new <contract name>
    dapple build [-e <environment>]
    dapple shell [-e <environment>]
    dapple run <script> [--save] [--unsafe] [-e <environment>]
    dapple test [-e <environment>] [-d <deploy script>]
    dapple rpc [-e <environment>] [-d <deploy script>]
    dapple publish [-e <environment>]
    dapple chain
    dapple step
    
    dapple env sync [<environment>]
    dapple env new <name>
    dapple env ls
    dapple env rm <name>
```

## init

#### Usage
`init`

#### Description

Converts the current directory into a Dapple package with a `dapple` directory
and a `dappfile` containing all the requisite boilerplate. Attempts to install a
core Dapple package via IPFS.

## install
#### Usage
`install [-e <environment>] <name or IPFS hash> [-v <version>] [--save]`

#### Description

Connects to the IPFS node specified in `.dapplerc`. If a package name was given
instead of an IPFS hash, connects to an Ethereum node and queries Dapple's ENS
path for the IPFS hash of the given version of the specified package. Defaults
to the latest version of the package if no version is specified.

Downloads the data at the IPFS hash to your package's Dapple dependencies
directory. If the `--save` flag is set, adds the package and its version, or the
IPFS hash if no package name was given, to your package's `dappfile`.

Outputs a success message to stdout showing the path of the installed package if
the installation succeeds. Outputs an error to stderr otherwise.

## new
#### usage
`new <contract name>`

#### description

Creates a new contract file with a simple skeleton and a corresponding file with
a Test contract for it. (Just a scaffolding nicety.)

## build

#### usage
`build [-e <environment>]`

#### description

Links and compiles all a Dapple package's classes and dependencies and writes
the combined JSON result (containing contract names mapped to their ABIs and
EVM bytecode) to stdout. The output produced is formatted identically to what
one would get from running `solc --combined-json abi,bin`.

## shell

#### usage
`shell [-e <environment>]`

#### description
Drops the user into a simple DDS shell, where they can issue deploy script
commands against the specified chain environment
interactively.

## run

#### usage
`run <script> [--save] [--unsafe] [-e <environment>]`

#### description
Builds your Dapple package and then runs the given deploy script against the
specified chain environment. If the specified chain environment is a local
private chain, then it runs it against it immediately. If the specified chain is
either the "internal" chain or a JSON-RPC chain, it first runs the deploy script
against a fresh fork of the given chain environment. If the deploy script
finishes without error, it then runs the deploy script against the given
environment.

If the `--unsafe` flag is set, it skips running the deploy script against a fork
of the given chain environment and runs it against the real thing immediately.

If the `--save` flag is set, Dapple modifies your package's `dappfile` so that
any object reference strings set during the run of the deploy script are
recorded there. (This can be especially useful if you are deploying against the
live chain in preparation for publishing your package.)

If the environment parameter is omitted, it runs the deploy script against
whatever environment is defined as `default` in `.dapplerc`.

Any object address definitions are output as they are defined, in the following
format:

`OBJECT: (object reference string) = (deployment address)`

Any classes deployed, whether referenced via an object address reference string
in the package's source code or not, are output as they are deployed:

`DEPLOYED: (class name) = (address deployed)`

Any operations requiring gas are reported as well:

`GAS COST: (gas spent) for "(operation summary)"`

This point may require some clarification. A class deployment whose output gets
assigned to the object reference string "ROOT_EXAMPLE", for example, may
produce something like the following two lines:

```
DEPLOYED: ExampleClass = 0xdeadbeef
GAS COST: 1000000 for "deploy ExampleClass"
OBJECT: ROOT_EXAMPLE = 0xdeadbeef
```

Deployments and address object definitions are handled separately because
address object definitions may not necessarily come from contract deployments.

Finally, any logging output is in the following format:

`LOG: (logged output)`

By default, `dapple` deploys the package defined in the current working
directory. Sub-packages of the package in the current working directory can be
specified via the `package` parameter.

## test
#### usage
`test [-e <environment>] [-d <deploy script>]`

#### description

Runs the package's tests against a private fork of the given chain environment.
If a deploy script is specified, it runs that before running the tests.

## rpc

#### usage
`rpc [-e <environment>] [-d <deploy script>]`

#### description
Opens a JSON-RPC endpoint for interacting with the given chain environment using
the settings specified in `.dapplerc`. Also runs the specified deploy script
against it, if one was passed in.

## publish

#### usage
`publish [-e <environment>]`

#### description
Connects to ENS and IPFS using the settings in your `.dapplerc` file. Publishes
your package to IPFS and attempts to associate the package name and version
specified in your `dappfile` with the resulting IPFS hash to ENS. Outputs the
IPFS hash to stdout. Outputs a success message to stdout if the ENS registration
succeeds and an error message to stderr if it fails.

If a specific chain environment is passed in, it tries to interact with ENS in
that particular environment.

## env sync

#### usage
`env sync [<environment>]`

#### description
Attempts to sync up the given chain environment. Does nothing for private test
forks, but can be useful for JSON-RPC and "internal" chain environments.

## env new

#### usage
`env new <name>`

#### description
Creates a new persistent private test chain from the live, main chain. You can
then use that chain's name wherever a "chain environment" is called for.
(JSON-RPC and "internal" chain environments can only be added by modifying
`.dapplerc` manually.)

## env ls 

#### usage
`env ls`

#### description
Lists all the chain environments and their block heights.

## env rm 
#### usage
`env rm <name>`

#### description
Removes a persistent private test chain. (JSON-RPC and "internal" chain
environments can only be removed by modifying `.dapplerc` manually.) 



# Definitions

## Chain Environment

A chain environment can consist of either a local private chain forked off of
the live main chain, or of settings that allow connecting to an Ethereum node.
running a JSON-RPC interface. Your `default` environment will always be
considered the live main chain, and thus must always consist of connection
settings for an Ethereum node.

## Dappfile Environment

The settings in your `dappfile` that apply to a particular chain environment.

## DDS

Dapple Deploy Script. A DSL for smart contract deployment via Dapple.

## DSL

Domain Specific Language. A language written for a specific problem domain.

## Environment

Your chain environment and dappfile environment taken together.

## IPFS

"[InterPlanetary File System]()". A decentralized way of hosting data.



# Proposed Definitions

These definitions may be controversial. Alternatives for the suggested
definitions are also listed and will remain (and may be added to or removed)
until we can arrive at consensus.

## Class Definition

A Solidity "contract" definition (potentially any bit of code that can be deployed)

(Alternatively: contract definition)

#### example
```
contract A { 
  function A() {
  }
}
```

## Class Name

A class (contract) name used during compilation.

(Alternatively: contract name)

#### example
```
"A"
```


## Class Header

Class name + the ABI for the class.

(Alternatively: contract header)

#### example

```
[
  "A",
  [{
    "inputs": [],
    "type": "constructor"
  }]
]
```


## Object Name

The name of an address in an abstract contract system, like `my_root_registry`.

(Alternately: unbound address placeholder)


## Object Reference

Object name + address.

(Alternatively: bound address placeholder)


## Object Header

Object name + class header.

(Alternatively: unbound contract instance)


## Object

Object reference and header.

(Alternatively: bound contract instance)


**TODO** - Continue expanding and formatting the definitions below.


## System Variables

A set of object headers.

(Alternatively: the unbound contract instances)


## Environment

A set of object references.

(Alternatively: chain state, bound address placeholders)


## Context

A mapping of system variables to an environment, defined as a union of
one or more other environments. For example, you might have a "working
environment" or an environment with no blockchain, but a context is associated
with a specific blockchain and a specific set of contracts.

(Alternatively: chain context)


## LINK(objectname) Macro

A preprocessor macro used in Solidity code.
It is populated with a unique dummy address by the dapple preprocessor.
You can think of using LINK as adding a special type of argument to
the constructor which can only be called at deploy time (by a key
and not an address).


## Class Template Definition

Any class definition that has a LINK macro.

(Alternatively: contract template definition)


## Class Template Header

A class header + metadata about LINKs (set of objectnames)


## Build Step

A step in the build process. May involve things such as gathering source files,
filling in macros, and compiling.


## Deploy Step

An instruction that makes a change to a (staged package?) AND/OR the global
network state.

    * pending: dapple sent a transaction, but has not confirmed the action
    * complete: dapple has confirmed that the transaction had the intended 
      effect and is permanent.

## Deploy Script

A sequence of deploy steps associated with a particular package. Scripts should
be agnostic to their environment, relying on link macros to fill in
environment-specific values based on the contexts defined in the package's
dappfile, but may not necessarily be.


## Chain Config

The information Dapple needs in order to connect to a particular chain. (e.g.,
the JSON-RPC configuration data in your `.dapplerc`.)


## Chain

Enough data and metadata to comprise a blockchain database. Two default chains
are named `ethereum` and `localtestnet`. Chains have a default chain config, but
a chain might have multiple valid chain config options (connect to the same
network/blockchain through different connections).

# Definition Proposals

## Packfile/Dappfile/Libfile

The file that defines a given package. Referred to in the above documentation
as "dappfile" for convenience and compatibility with `pydapple`, even though
the term is currently tentative.


## Contract Sources

A set of Solidity source files.


## Package

A collection of contract sources with a chain context, name, version, and list
of dependencies. This is what Dapple pulls in when one runs `dapple install`.


## Bound Package

A package with all named object/address references defined.


## Unbound Package

A package with at least one undefined object/address reference defined.


## Staged Package

A package whose chain context can be modified.


## Complete Package

A package which either is bound or which can become bound if a deploy script
distributed with it is run, and which only has complete packages as
dependencies.


## System Instance

The set of objects named by the chain context of a deployed system type.


A package will typically ship a dev deploy sequence which will create a chain
context which mocks the one deployed on Ethereum.
