`dapple`
===

`dapple` is a tool for Solidity developers to help build and manage complex contract systems on Ethereum-like blockchains.

Some features:

* Contracts are run through the `cog` preprocessor, which a few use cases:
    * "generic" functions
    * Singleton contracts (hard-code addresses for a particular chain context)
    * easier batch transactions (I still can't figure out how to encode structs and arrays outside of solidity)
* `dapple test`: You write your Solidity tests in Solidity, not Javascript!
* `dapple do` reproducible deploy steps
* package system (a `pack` is solidity sources + chain contexts + some metadata)

Future plans:

* Work towards a contract package standard
* admin GUI based on universal-dapp


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

The following step is not optional:

    pip install -r requirements.txt

After this, you should have all of dapple's dependencies installed. The files related to the dapple CLI utility can be found in `/dapple`. To run the dapple CLI utility without having to install it, you can use `python -m dapple`.

Usage
=====

Dapple packages are defined by the presence of a dapple.yaml file in the root directory. At minimum, the dapple.yaml file must define the following keys:

`name`: The name of the dapple package.

The following keys may also be defined:

`dependencies`: A mapping of the names dapple packages this package depends on to either the specific versions of those packages required or to the specific location to load the package from. A value of "latest" signifies that the latest version should be used.

You may use dot notation to collapse nested mappings. In other words, this:

    environments:
        prod:
            contracts:
                NAME_REG: "0x..."

Can be shortened to this:

    environments.prod.contracts.NAME_REG: "0x..."


Usage Prototype 
===============

The below documentation does not describe the way dapple currently works, but is instead documentation describing how dapple may eventually work. As pieces are implemented, the corresponding documentation will be moved to the "Usage" section above.

Dapple packages are defined by the presence of a dapple.yaml file in the root directory. At minimum, the dapple.yaml file must define the following keys:

`name`: The name of the dapple package.

`version`: The version of the dapple package.

The following keys may also be defined:

`dependencies`: A mapping of the names dapple packages this package depends on to either the specific versions of those packages required or to the specific location to load the package from. A value of "latest" signifies that the latest version should be used.

`contracts`: A mapping of regex-able strings to either hexadecimal constants or to contract names. Dapple looks for matches to the keys in this mapping during the preprocessing step. For each unique match, it either swaps in the hexadecimal constant or deploys the contract on the current blockchain and swaps in the resulting contract address if the contract has not already been previously deployed in this environment or if the contract has changed since its last deployment. Makes it easy to set static or dynamic address references as one has need.

`libraries`: If your contract makes use of libraries, you can specify the addresses for those libraries here. Maps library names to addresses, much like the `contracts` mapping. Does not support regex matching. See the [Solidity documentation on libraries](https://github.com/ethereum/wiki/wiki/Solidity-Tutorial#libraries) for more details.

`environments`: A mapping of environment names to mappings of values to override in dapple.yaml when dapple is passed the given environment name. Can also map environment names to alternative YAML files of the same format as "dapple.yaml," with the exception that any `environments` keys in those files will be ignored.

In addition, dot notation may be used to override settings in the packages loaded in `dependencies`. For example, if you load a package called `eth-common` that defines a `NAME_REG` value in its `contracts` mapping, you can override this value by defining a mapping of the key `eth-common.contracts.NAME_REG` to whatever value you prefer. This override will persist for all packages loaded by your package.

Internally, dapple uses a plugin system for all its functionality. Each top-level mapping in your dapplefile defines the settings for a plugin. Specific plugins can be run by specifying their names on the command line when running dapple. For example, `dapple new` simply runs the plugin registered under the name "new." The order of plugins in the dapplefile is of no consequence: plugins manage their dependencies internally and ensure any plugins they need are loaded first.
