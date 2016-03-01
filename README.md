<img src='https://ipfs.pics/ipfs/QmPy1osQumX7ugMKiFYL8Y9dKdPnCcq64H2ZfefeRdeddd'/>
<br><br>
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Build Status](https://travis-ci.org/NexusDevelopment/dapple.svg?branch=master)](https://travis-ci.org/NexusDevelopment/dapple)
[![Slack Status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)

`dapple` is a Solidity developer multitool concerned primarily with managing the growing complexity of interconnected smart contract systems. Its core functionality encompasses *package management*, *build process*, and *deployment scripting*. These concepts are related in a way that is unique to the smart contract ecosystem, due to each blockchain's universal singleton nature. The central data model is the `dappfile`, whose definition depends on IPFS and also on the Ethereum blockchain specifically.

#### Installation

`npm install -g dapple`

#### Basic Usage

##### Create a package directory
```
mkdir mydapp && cd mydapp
dapple init
```

`dapple init` generates a simple boilerplate `dappfile` in the current
directory.

If no errors are displayed, the initialization was a success. You should be able
to see the boilerplate `dappfile` in your current directory, along with a couple
other directories:

```
$ ls
build  contracts  dappfile
```

By default, `build` is where the output of `dapple build` gets put, and
`contracts` is where Dapple looks for your contract source files. Both of these
are configured in your `dappfile` and can be overridden.



Write a contract and test (see [dapple test harness docs](https:github.com/nexusdev/dapple/doc/test.md)).

```
vim contracts/dapp.sol
vim contracts/dapp_test.sol
dapple test
```

By default, dapple builds the entire `contracts` tree, and emits the following:
* dapple build cache objects
* `classes.json`, all type definitions
* `js_module.js`, a javascript module which wrapps classes.json and adds instantiated web3js Contract objects for each object in the dappfile.

```
dapple build
```

Feature docs:

* [Basic VM tests](https://github.com/nexusdev/dapple/blob/master/doc/test.md)
* [Testing Exceptions](https://github.com/nexusdev/dapple/blob/master/doc/test_errors.md)
* [Testing Events](https://github.com/nexusdev/dapple/blob/master/doc/test_events.md)
* [Installing/Publishing Packages](https://github.com/nexusdev/dapple/blob/master/doc/install_publish.md)
* [Deployment Scrpting](https://github.com/nexusdev/dapple/blob/master/doc/deployscript.md)


To document:
* Aliasing and imports
* Environments and object linking
* Ignore/add
