![Dapple](https://ipfs.pics/ipfs/QmdUKEX48hXDgG2Y4XkxKJMV8qojiLYGc2mtEncBcEnSLd)

[![Version](https://img.shields.io/badge/version-0.3.0-8D86C9.svg?style=flat-square)](https://github.com/nexusdev/dapple/releases/tag/0.3.0)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Build status](https://travis-ci.org/nexusdev/dapple.svg?branch=master)](https://travis-ci.org/nexusdev/dapple)
[![Slack status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)

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

#### Installation

The normal way to install Dapple is through npm:

    $ npm install -g dapple
    $ dapple help

If you don't want to install Dapple and the Solidity compiler on your
host machine, you can use the `dapple-docker` wrapper script to run
the whole toolchain inside a Docker container.  This script is used
instead of `dapple` and can be installed separately:

    $ make install-dapple-docker
    $ dapple-docker help

#### Basic usage

Use `dapple init` to generate a simple boilerplate `dappfile` along
with a couple of other directories:

    $ mkdir mydapp
    $ cd mydapp
    $ dapple init
    $ ls
    build  contracts  dappfile

By default, `build/` is where the output of `dapple build` gets put,
and `contracts/` is where Dapple looks for your contract source files.
Both of these are configured in your `dappfile` and can be overridden.

Now try writing a contract and a test (see [Dapple test harness docs](https://github.com/nexusdev/dapple/blob/master/doc/test.md)):

    $ $EDITOR contracts/dapp.sol
    $ $EDITOR contracts/dapp_test.sol
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

#### More information

* [Basic VM tests](https://github.com/nexusdev/dapple/blob/master/doc/test.md)
* [Testing exceptions](https://github.com/nexusdev/dapple/blob/master/doc/test_errors.md)
* [Testing events](https://github.com/nexusdev/dapple/blob/master/doc/test_events.md)
* [Installing and publishing packages](https://github.com/nexusdev/dapple/blob/master/doc/install_publish.md)
* [Deployment scripting](https://github.com/nexusdev/dapple/blob/master/doc/deployscript.md)

#### Not yet documented

* Aliasing and imports
* Environments and object linking
* Ignore/add
