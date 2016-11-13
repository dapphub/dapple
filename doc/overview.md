# Overview

## basic usage

Use `dapple init` to generate a simple boilerplate `dappfile` along
with a couple of other directories:

    $ mkdir my-dapp
    $ cd my-dapp
    $ dapple init

```
$ tree .
.
├── build
├── Dappfile
└── src

2 directories, 1 file
```

By default, `build/` is where the output of `dapple build` gets put,
and `src/` is where Dapple looks for your contract source files.
Both of these are configured in your `Dappfile` and can be overridden.

Now try writing a contract and a test (see [Dapple test harness docs](test.md)):

    $ vim src/dapp.sol
    $ vim src/dapp_test.sol
    $ dapple test

Finally, try building your project:

    $ dapple build

By default, `dapple build` builds the entire `src/` tree, and
emits the following:

* cached build objects
* `classes.json` — a list of type definitions
* `js_module.js` — a JavaScript module which wraps `classes.json` and
adds `Contract` objects instantiated from `web3.js` for each object in
the `Dappfile`
