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

# Configuration

## .dapplerc

Dapple creates a `.dapplerc` file in the  user's home directory upon first run.
This file contains all settings specific to the user's development environment,
such as connection parameters for IPFS. Multiple environments may be specified
here, each with its own group of settings.

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

Each command also operates on the `default` environment defined in the package's
`dappfile` if the command's `environment` parameter is left unspecified. If no
`default` environment is defined *and* no `environment` parameter is passed in,
it returns an error.

## `build (dappfile environment)?`

Links and compiles all a Dapple package's classes and dependencies and writes
the combined JSON result (containing contract names mapped to their ABIs and
EVM bytecode) to stdout. The output produced is formatted identically to what
one would get from running `solc --combined-json abi,bin`.

## `deploy (script) (.dapplerc environment)?`

Builds a Dapple package and runs the specified deploy script against a private
test fork of the mainnet chain and then runs it against the live version if the
script succeeds. If deployment against the live chain fails, immediately halts
the execution of the deploy script and sends the relevant error message to
stderr.

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

## `test`

Creates a private test fork of the mainnet chain and runs all
the package's Solidity unit test classes against it.

## `testrpc (.dapplerc environment)? (deploy script)?`

Creates a private test fork of the mainnet chain and opens a JSON-RPC endpoint
for interacting with it using the settings specified in `.dapplerc`. Also runs
the specified deploy script against it, if one was passed in.

## `install (.dapplerc environment)? (package name or IPFS hash) (version)?
(--save)?`

Connects to the IPFS node specified in `.dapplerc`. If a package name was given
instead of an IPFS hash, connects to an Ethereum node and queries Dapple's ENS
path for the IPFS hash of the given version of the specified package. Defaults
to the latest version of the package if no version is specified.

Downloads the data at the IPFS hash to your package's Dapple dependencies
directory. If the `--save` flag is set, adds the package and its version, or the
IPFS hash if no package name was given, to your package's `dappfile`.

Outputs a success message to stdout showing the path of the installed package if
the installation succeeds. Outputs an error to stderr otherwise.

## `publish (.dapplerc environment)?`

Connects to ENS and IPFS using the settings in your `.dapplerc` file. Publishes
your package to IPFS and attempts to associate the package name and version
specified in your `dappfile` with the resulting IPFS hash to ENS. Outputs the
IPFS hash to stdout. Outputs a success message to stdout if the ENS registration
succeeds and an error message to stderr if it fails.

## `chain`

Connects to the Ethereum network syncs with the mainnet blockchain.

# Jargon

## IPFS

"[InterPlanetary File System]()". A decentralized way of hosting data.

## DDS

Dapple Deploy Script. A DSL for smart contract deployment via Dapple.

## DSL

Domain Specific Language. A language written for a specific problem domain.
