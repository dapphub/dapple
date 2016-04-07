## Embark

### CLI 

```
  Usage: embark [options] [command]


  Commands:

    new [name]            New application
    deploy [env]          deploy contracts
    build [env]           build dapp
    ipfs [env]            build dapp and make it available in ipfs
    run [env]             run dapp
    spec                  run tests
    blockchain [env]      run blockchain
    geth <env> [args...]  run geth with specified arguments
    demo                  create a working dapp with a SimpleStorage contract
    meteor_demo           create a working meteor dapp with a SimpleStorage contract
    simulator             run a fast ethereum rpc simulator

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```


## Truffle

### CLI

```
Truffle v0.2.1 - a development framework for Ethereum

Usage: truffle [command] [options]

Commands:

  build           => Build development version of app; creates ./build directory
  compile         => Compile contracts
  console         => Run a console with deployed contracts instanciated and available (REPL)
  create:contract => Create a basic contract
  create:test     => Create a basic test
  deploy          => Deploy contracts to the network
  dist            => Create distributable version of app (minified); creates ./dist directory
  exec            => Execute a Coffee/JS file within truffle environment. Script *must* call process.exit() when finished.
  init            => Initialize new Ethereum project, including example contracts and tests
  init:config     => Initialize default project configuration
  init:contracts  => Initialize default contracts directory
  init:tests      => Initialize tests directory structure and helpers
  list            => List all available tasks
  resolve         => Resolve dependencies in contract file and print result
  serve           => Serve app on http://localhost:8080 and rebuild changes as needed
  test            => Run tests
  version         => Show version number and exit
  watch           => Watch filesystem for changes and rebuild the project automatically
```

## Populus

### CLI
```
Usage: populus [OPTIONS] COMMAND [ARGS]...

  Populus

Options:
  --help  Show this message and exit.

Commands:
  attach   Enter a python shell with contracts and...
  chain    Wrapper around `geth`.
  compile  Compile project contracts, storing their...
  deploy   Deploy contracts.
  init     Generate project layout with an example...
  web      HTML/CSS/JS tooling.
```

## Spore

### CLI

```
Usage:
  spore init
  spore upgrade
  spore publish
  spore add       <path>
  spore link

  spore info    [<package>]
  spore install [<package>]
  spore clone     <package>
  spore uninstall <package>

  spore chain list
  spore chain select <name>
  spore chain add    <name>
  spore chain remove <name>

  spore update
  spore search <string>

  spore instance add <package> <address> [--contract=<contract>]
  spore instance list <package>

  spore bin list
  spore bin call <name> [<args>...]
  spore bin bundle [<package>]
  spore bin remove <name>
```
