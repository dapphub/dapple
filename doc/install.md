# Installation

If you are running Ubuntu 14.04 or above you can follow [this guide](#Ubuntu).
You can also install Dapple in a Docker container following [this guide](#Docker)

## Dapple

Make sure you have node v5+ installed:
```
$ node --version
v5.0.0
```

The normal way to install Dapple is through npm:

```
$ npm install -g dapple
$ dapple help
```

## Solidity
We recommend a native solc compiler. Install the newest version following [this guide](https://solidity.readthedocs.org/en/latest/installing-solidity.html).

## Geth
We recomment `geth` as a rpc client. Follow [this guide](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum) to install geth.

## Ipfs
Dapple uses Ipfs as its data layer. We recommend installing it following [this guide](https://ipfs.io/docs/install/).

You can check your ipfs version by running `ipfs version`.


##System specific guides:
###Ubuntu

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

###Docker
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
