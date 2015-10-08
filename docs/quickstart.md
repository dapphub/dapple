Quickstart
----------


A note before starting
======================

Throughout this documentation, I use words in <angle brackets> to denote where you should fill in values of your own choosing. I have endeavored to make the angle-bracketed phrases self-explanatory and consistent. For example, I use <mypackage> to denote the name you choose for your package. Anywhere you see <mypackage>, you should be able to fill in the same value you chose initially and do alright.


Installation
============

On the command line:

    git clone https://github.com/MakerDAO/dapple
    cd dapple
    python setup.py install


Package creation
================

On the command line:

    mkdir <mypackage>
    cd <mypackage>
    dapple init

Dapple packages are defined by the presence of a `.dapple` directory containing a [`dappfile`](dappfile.md) YAML file. `dapple init` creates this structure for you. Edit `.dapple/dappfile` in your <mypackage> directory to, at minimum, list your package's name and version. By default, the `core` package is included as a dependency of all new packages. The `core` package contains the contracts that Dapple relies on to run tests on your smart contract package.


Package installation
====================

From within your package's root directory:

    dapple install <somepackage> --save

The `--save` flag tells Dapple that it should add the package to your dependencies map in your dappfile. Without this flag, Dapple would install the package without adding it to your dappfile. Generally, Dapple tries to make it obvious when it's about to change your dappfile. Running `install` sans the `--save` flag lets you try packages locally without making a mess of your dappfile in the process. 

To remove packages, use `uninstall`:

    dapple uninstall <somepackage> --save


Package publishing
==================

Publishing a package is as simple as:

    dapple publish

You must, however, have a copy of [IPFS](http://ipfs.io/) running and your [.dapplerc](dapplerc.md) pointed at it to publish anything. By default, Dapple connects to a public read-only gateway maintained by the IPFS developers to allow package installation without a local copy of IPFS. Publishing cannot be done through such a gateway.
