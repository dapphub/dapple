## Install and Publish

Note: DapphubDB address not finalized, use caution until this notice is removed.

### DapphubDb

Dapple is capable of interacting with an on-chain package registry for installing
and publishing packages. IPFS is used as a storage and data transfer layer.
A dapple package is content addressed by an ipfs hash. The hash is stored along
with the package name and semantic version on the ethereum chain.
In order for this to work the user must have a working Ethereum and IPFS connection
specified in his `~/.dapplerc`.

#### installing

The command to install a package from the registry is:

`dapple install [--save] [options] [<package> <url-or-version>]`

E.g. `dapple install dappsys 0.1.0 --save`

This will install dappsys package at version 1.0.0 from the registry which is
deployed to morden chain and save this dependecy to the local dappfile, which
is indicated by the `--save` flag.

All packages with are specified in the dependency section of the local dappfile
can be installed with `dapple install`:

```
[...]
dependencies:
  dappsys: 0.1.0
```

#### publishing

To prevent pollution of the global namespace, publishing is currently restricted
to a few trusted dapple developers who curate the registry.
This is ensured by the authentication system provided by [dappsys](https://github.com/nexusdev/dappsys) framework.
The intent is to enable open publication as soon as some kind of arbitration or at least
initial distribution scheme is invented. It is possible to update the system in-place,
and there will be no need to redeploy the data store contract which dapple reads from.

The command `dapple publish [options]` will build the current package based on
the specifications given in the local dappfile and publish it to the registry
on the specified chain. For this a version tag and a name has to be specified
in the local dappfile:
```
name: mypackage
version: 1.0.0
[...]
```
