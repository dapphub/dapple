# Dapple
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Slack Status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)
[![Build Status](https://travis-ci.org/NexusDevelopment/dapple.svg?branch=master)](https://travis-ci.org/NexusDevelopment/dapple)

<p align="center">
  <img width=196" src="http://ipfs.pics/ipfs/QmPQcPiaep6Bfp956b5xLDaQdtQVtAWBT9QjWNRiL9y8Cw"/>
</p>

`dapple` is a tool for Solidity developers to help build and manage complex contract systems on Ethereum-like blockchains.


#### Installation

`npm install -g dapple`

#### Basic Usage

Note that not everything is implemented in the JS rewrite.
```
mkdir mydapp && cd mydapp
dapple init

# Write some contracts - see docs for test contract format
vim src/sol/mycontract.sol
vim src/sol/mycontract_test.sol

dapple test # run VM tests
dapple build # export contract definitions, solidity headers, and JS headers (node and browser)

# Write a deploy sequence
vim steps/deploy.step
dapple chain ethereum          # switch chains to default mainnet
dapple run steps/deploy.step   # run the deploy sequence

```

#### Example dapple packages

Some may still be in an outdated package format.

https://github.com/NexusDevelopment/dappsys

https://github.com/NexusDevelopment/keeper/tree/nexus/keeperd/dapp

https://github.com/NexusDevelopment/ENS

https://github.com/NexusDevelopment/guts
