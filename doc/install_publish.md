## Install and Publish

### DapphubDb

Dapple is capable of installing packages from a central on chain registry and
publish packages to the registry.
Ipfs is used as a storage and data transfear layer.
A dapple package is content addressed by an ipfs hash.
In order for this to work the user must have a working chain connection
specified in his `~/.dapplerc` as well as a running ipfs daemon also specified 
correctly in the dapplerc.

#### installing

Once can use the commandline interface to isntall a package from the registry:

`dapple install [--save] [options] [<package> <url-or-version>]`

e.g. `dapple install dappsys 1.0.0 --save -e morden`

This will install dappsys package at version 1.0.0 from the registry which is
deployed to morden chain and save this dependecy to the local dappfile, which
is indicated by the `--save` flag.

All packages with are specified in the dependency section of the local dappfile
can be installed with `dapple install`:

```
[...]
dependencies:
  dappsys: 1.0.0
```

#### publishing

To prevent poluting the global namespace, publishing is currently restricted
to the internal dapple developers. This is ensured by the authentication system
provided by dappsys framework. After a initial test phase a publish use will
be introduced to the public.

The command `dapple publish [options]` will build the current package based on
the specifications given in the local dappfile and publish it to the registry
on the specified chain. For this a version tag and a name has to be specified
in the local dappfile:
```
name: mypackage
version: 1.0.0
[...]
```
