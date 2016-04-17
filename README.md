![Dapple](https://ipfs.pics/ipfs/QmdUKEX48hXDgG2Y4XkxKJMV8qojiLYGc2mtEncBcEnSLd)

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Build status](https://travis-ci.org/nexusdev/dapple.svg?branch=master)](https://travis-ci.org/nexusdev/dapple)
[![Slack status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)
[![Documentation](https://img.shields.io/badge/docs-latest-brightgreen.svg?style=flat)](http://dapple.readthedocs.org/en/latest/?badge=latest)
[![Stories in Ready](https://badge.waffle.io/nexusdev/dapple.png?label=ready&title=Ready)](https://waffle.io/nexusdev/dapple)

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

#### Ubuntu 14.04 or above

If you're on Ubuntu 14.04 or above and don't have Node.js or the
Solidity compiler, try following these steps to install them:

Install Node.js:

    apt-get install -y curl
    curl -sL https://deb.nodesource.com/setup_5.x | bash
    apt-get update
    apt-get install -y nodejs

Install Solidity:

    apt-get install -y software-properties-common
    add-apt-repository ppa:ethereum/ethereum
    add-apt-repository ppa:ethereum/ethereum-qt
    apt-get update
    apt-get install -y cpp-ethereum

Install Dapple:

    apt-get install -y git build-essential python
    git clone https://github.com/nexusdev/dapple
    cd dapple
    npm link

#### Docker

If you can't or don't want to install Dapple and the Solidity compiler
on your host machine, you can use the `dapple-docker` wrapper script
to run the whole toolchain inside a Docker container.  This script is
used instead of `dapple` and can be installed separately:

    $ make docker-install
    $ dapple-docker help

The current directory is automatically mounted into the containers.
**Note:** If you're on OS X, this only works in your home directory.

Your UID and GID are preserved by synthesizing a new user inside each
container that mimics the properties of the user on your host machine.

Use `dapple-docker-shell` to open a shell in a container:

    ~$ cd src/dapple
    ~/src/dapple$ dapple-docker-shell
    john@63faad532599:~/src/dapple$ dapple help
    john@63faad532599:~/src/dapple$ npm test
    john@63faad532599:~/src/dapple$ # etc.

### Basic usage

Use `dapple init` to generate a simple boilerplate `dappfile` along
with a couple of other directories:

    $ mkdir my-dapp
    $ cd my-dapp
    $ dapple init
    $ ls
    build  contracts  dappfile

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

#### More information

* [Basic VM tests](https://github.com/nexusdev/dapple/blob/master/doc/test.md)
* [Testing exceptions](https://github.com/nexusdev/dapple/blob/master/doc/test_errors.md)
* [Testing events](https://github.com/nexusdev/dapple/blob/master/doc/test_events.md)
* [Installing and publishing packages](https://github.com/nexusdev/dapple/blob/master/doc/install_publish.md)
* [Deployment scripting](https://github.com/nexusdev/dapple/blob/master/doc/deployscript.md)
* [Logging](https://github.com/nexusdev/dapple/blob/master/doc/logging.md)

#### Not yet documented

* Aliasing and imports
* Environments and object linking
* Ignore/add
