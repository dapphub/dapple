<p align="center">
  <img src="http://ipfs.pics/ipfs/QmPQcPiaep6Bfp956b5xLDaQdtQVtAWBT9QjWNRiL9y8Cw"/>
</p>

`dapple` is a tool for Solidity developers to help build and manage complex contract systems on Ethereum-like blockchains.

Some features:



* `dapple test`: You write your Solidity tests in Solidity, not the harness language
* `dapple do` reproducible deploy steps
* chain contexts: handling equivalent address references on different chains (e.g., libraries and registries on testnet vs mainnet)
* package system based on ipfs
* contracts are run through the `cog` preprocessor, which is useful because solidity has no macros or generics

Future plans:

* test against specific chain state (like mainnet latest)
* extend contract package standard
* lay foundation for alternative dapp browser if mist falls through


It was developed out of necessity and in a somewhat ad-hoc manner. The current state of the code reflects this, and it is not a fun time for outside devs yet. We'll hire you to fix that, though.

Basic installation
==================

    python setup.py install

Will eventually be available on PyPi as well.

Development installation
========================

First, it's recommended (though not necessary) to set up a clean environment specifically for working on dapple.

    pip install virtualenvwrapper
    mkvirtualenv dapple

If the `mkvirtualenv` command doesn't work, you might need to add [virtualenvwrapper](https://bitbucket.org/dhellmann/virtualenvwrapper) to your path. In OS X this can be accomplished with:

    echo "source /usr/local/bin/virtualenvwrapper.sh" >> ~/.zshrc

This will create a Python virtual environment called `dapple` and drop you into it. To leave the virtual environment, type `deactivate`. To return to it, type `workon dapple`.

And then install in the usual way:

    python setup.py install

After this, you should have all of dapple's dependencies installed. The files related to the dapple CLI utility can be found in `/dapple`. To run the dapple CLI utility without having to install it, you can use `python -m dapple`.

Basic Usage
===========

You may import files from Dapple packages by simply importing from them as if they were directories. For example, to import `test.sol` from a package called `core`, you would write `import "core/test.sol";`. If you happened to also have a local directory named "core" you wanted to import another contract from, you would write `import "./core/foobar.sol"`. All local imports are interpreted relative to the project's root directory.

Dapple packages are defined by the presence of a `.dapple` directory containing a `dappfile` YAML file. At minimum, `dappfile` must define the following keys:

`name`: The name of the dapple package.

`version`: The version of the dapple package.

The following keys may also be defined:

`source_dir`: By default, Dapple will process all source files in the project's root directory and its descendants. It will also interpret imports relative to the project's root directory during the build process. This setting overrides this behavior and allows you to specify a subfolder of the project to use instead.

`ignore`: A list of filenames to ignore. [Globbing](https://en.wikipedia.org/wiki/Glob_%28programming%29) is supported.

`preprocessor_vars`: Variables to pass in for your preprocessor or templating engine to use in its rendering context. Dapple uses [cogapp](http://pypi.python.org/pypi/cogapp) by default.

`contexts`: A mapping of environment names to constants and their values. Constants may be inserted into smart contract source code at any point via `CONSTANT(some_constant)`. The `CONSTANT` directive and all constant names are case sensitive.

`dependencies`: A mapping of the names of dapple packages this package depends on to the specific versions of those packages required, or to the specific location to load the package from. A value of "latest" signifies that the latest version should be used.

You may use dot notation to collapse nested mappings. In other words, this:

    contexts:
        prod:
            NAME_REG: "0x..."

Can be shortened to this:

    contexts.prod.NAME_REG: "0x..."


Writing Tests
===

VM tests can be written in solidity by inheriting from the `Test` contract in `core/test.sol'`.
`dapple` will build an instance of the contract for each function that starts with `test`. It will call `setUp` and then the `test*` function. Failures are detected by emitting the `fail` event (or use the `assert*` helpers).

You can look at a complete example in `contracts/example/simple_test.sol`.

IPFS
====

Package publishing and installation is done via IPFS. By default, Dapple tries to connect to a local IPFS instance. To change its IPFS connection settings, edit your ~/.dapplerc file.


Publishing Packages
===================

Run the following in your package's root directory:

    dapple publish

Remember the IPFS hash it gives you! At present, anyone who wants to install your package will need it.


Installing Packages
===================

Right now you must specify the IPFS hash of the package you want to install, as well as the name you want to install it under. Once we have a proper package name service running, this requirement will change. For now, you can install packages like so:

    dapple install core --ipfs QmabKxK119XaoLw21wkyxcRkcuxNevZc9nFcUppdoG1AoH

You will also have to manually include the package's name in your `dappfile`'s dependencies map. Eventually this will be automated for you via the `--save` parameter.


Basic Usage Prototype 
===============

The below documentation does not describe the way dapple currently works, but is instead documentation describing how dapple may eventually work. As pieces are implemented, the corresponding documentation will be moved to the "Usage" section above.

The following keys may also be defined in your dappfile:

`libraries`: If your contract makes use of libraries, you can specify the addresses for those libraries here. Maps library names to addresses, much like the `contracts` mapping. See the [Solidity documentation on libraries](https://github.com/ethereum/wiki/wiki/Solidity-Tutorial#libraries) for more details.


Plugins
=======

Internally, Dapple uses a plugin system for all its functionality. Each plugin may define a set of commands and potentially override default behavior. Dapple plugins are technically just Python modules that know how to register themselves with Dapple. The core Dapple functions are themselves defined via the `dapple_core` plugin. Look at `/dapple_core` in this repo for an example of how to write plugins and register new Dapple commands.

At present there is no special infrastructure for Dapple plugins. You must use the usual Python package repositories and publishing tools to distribute your plugins. [PyPI](http://pypi.python.org/) and [pip](https://pip.pypa.io/en/stable/) are recommended.


Building documentation
======================

If you're using the latest Docker image, you should already have [Mkdocs](http://www.mkdocs.org/) installed. If not, install it via:

    pip install mkdocs

From the root project directory, run `mkdocs build`. To run a local server for previewing the documentation, run `mkdocs serve`.
