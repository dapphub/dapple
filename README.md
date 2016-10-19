![Dapple](https://ipfs.pics/ipfs/QmdUKEX48hXDgG2Y4XkxKJMV8qojiLYGc2mtEncBcEnSLd)

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Build status](https://travis-ci.org/nexusdev/dapple.svg?branch=master)](https://travis-ci.org/nexusdev/dapple)
[![Chat](https://img.shields.io/badge/community-chat-brightgreen.svg?style=flat-square)](https://dapphub.chat/channel/dapple)
[![Documentation](https://img.shields.io/badge/docs-master-brightgreen.svg?style=flat)](http://dapple.readthedocs.org/en/master/?badge=master)
[![Stories in Ready](https://badge.waffle.io/nexusdev/dapple.png?label=ready&title=Ready)](https://waffle.io/nexusdev/dapple)
[![Dependencies](https://david-dm.org/nexusdev/dapple.svg)](https://david-dm.org/nexusdev/dapple)

Dapple is a Solidity developer multitool designed to manage the
growing complexity of interconnected smart contract systems.

Its core functionality encompasses three main areas:

* Package management
* Contract building
* Deployment scripting

These concepts are related in a way unique to the smart contract
ecosystem, due to each blockchain's universal singleton nature.

The central data model for Dapple is the `dappfile`, whose definition
will normally reference IPFS objects and Ethereum contract addresses.

### Installation

The normal way to install Dapple is through npm:

    $ npm install -g dapple
    $ dapple --help

You can read about detailed system specific installation on the [documentation](http://dapple.readthedocs.io/en/master/install/).


### Basic usage

Use `dapple init` to generate a project skeleton:

    mkdir foo;
    cd foo;
    dapple init

By default, `build/` is where the output of `dapple build` gets put,
and `contracts/` is where Dapple looks for your contract source files.
Both of these are configured in your `dappfile` and can be overridden.

Now try writing a contract and a test (see [Dapple test harness docs](https://github.com/nexusdev/dapple/blob/master/doc/test.md)):

    $ vim contracts/dapp.sol
    $ vim contracts/dapp_test.sol
    $ dapple test

Finally, try building your project:

    $ dapple build

By default, `dapple build` builds the entire `contracts/` tree, and
emits the following:

* cached build objects
* `classes.json` — a list of type definitions
* `js_module.js` — a JavaScript module which wraps `classes.json` and
adds `Contract` objects instantiated from `web3.js` for each object in
the `dappfile`

#### Example packages

* [Dappsys](https://github.com/nexusdev/dappsys) — a contract system framework (Nexus's "standard library")
* [Feedbase](https://github.com/nexusdev/feedbase) — a simple paid feed app
* [stringutils](https://github.com/Arachnid/solidity-stringutils) — string manipulation library
* [RanDAOPlus](https://github.com/tjade273/RanDAOPlus) - Experimental Ethereum RNG based on PoW

#### More information

* [tests](http://dapple.readthedocs.io/en/master/test/)
* [packages](http://dapple.readthedocs.io/en/master/packages/)
* [Deployment scripting](http://dapple.readthedocs.io/en/master/dapplescript/)
* [Logging](http://dapple.readthedocs.io/en/master/logging/)
* [dapplerc](http://dapple.readthedocs.io/en/master/dapplerc/)
* [troubleshoot/ FAQ](http://dapple.readthedocs.io/en/master/troubleshoot/)

#### Not yet documented

* Aliasing and imports
* Environments and object linking
* Ignore/add
