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

This will create a Python virtual environment called `dapple` and drop you into it. To leave the virtual environment, type `deactivate`. To return to it, type `workon dapple`.

The following step is not optional:

    pip install -r requirements.txt

After this, you should have all of dapple's dependencies installed. The files related to the dapple CLI utility can be found in `/dapple`. To run the dapple CLI utility without having to install it, you can use `python -m dapple`.
