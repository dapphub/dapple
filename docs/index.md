![Dapple](https://ipfs.pics/ipfs/QmdUKEX48hXDgG2Y4XkxKJMV8qojiLYGc2mtEncBcEnSLd)

[![Version](https://img.shields.io/badge/version-0.6.0-8D86C9.svg?style=flat-square)](https://github.com/nexusdev/dapple/releases/tag/0.6.0)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)
[![Build status](https://travis-ci.org/nexusdev/dapple.svg?branch=master)](https://travis-ci.org/nexusdev/dapple)
[![Slack status](http://slack.makerdao.com/badge.svg)](https://slack.makerdao.com)
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
