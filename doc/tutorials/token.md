# Making a Token

Taking a page out of [Alex Van de Sande's
book](https://blog.ethereum.org/2015/12/03/how-to-build-your-own-cryptocurrency/),
I am going to demonstrate building a token contract that implements the token
standard ([EIP 20](https://github.com/ethereum/EIPs/issues/20)) using Dapple.
This is a much more code-heavy approach than Alex's, though, and is geared
toward developers who like test driven development and prefer the CLI to GUIs. I
will be building this using the [Nexus Developer Docker
image](https://github.com/NexusDevelopment/devenv-docker). You will not need
this image to follow along, but it might make it easier for you to get started
if you don't already have an Ethereum development environment set up.

## Install Dapple

If you aren't using the Docker image, you will probably need to install Dapple.
Doing so is as simple as:

```
$ git clone https://github.com/NexusDevelopment/dapple.git
$ cd dapple
$ npm install -g .
```

Verify that Dapple is installed:

```
$ dapple
Usage:
    dapple config
    dapple init
    dapple install [--save] [<package>]
    dapple build [options]
    dapple chain
    dapple step
    dapple test [options] [--skip-build]
```

Your first time running Dapple, you will be prompted a few times for some
configuration settings. Dapple uses these to connect to IPFS and your Ethereum
client. We won't be connecting to either service for this tutorial, so go ahead
and accept the defaults. If you want to change your settings later on, you may
do so by either running `dapple config` or by editing `~/.dapplerc`.

## Create your package

The root of a Dapple package is defined by the presence of a `dappfile`. To
start, create a directory to hold your project. For the sake of the tutorial,
let's call it "mytoken".

```
$ mkdir mytoken
$ cd mytoken
```

`dapple init` generates a simple boilerplate `dappfile` in the current
directory. Run that now:

```
$ dapple init
```

If no errors are displayed, the initialization was a success. You should be able
to see the boilerplate `dappfile` in your current directory, along with a couple
other directories:

```
$ ls
build  dappfile  src
```

By default, `build` is where the output of `dapple build` gets put, and
`src/sol` is where Dapple looks for your contract source files. Both of these
are configured in your `dappfile` and can be overridden. For this tutorial,
we'll leave them as-is.

Since we're demonstrating a TDD flow here, let's start by making a directory for
our test contracts:

```
$ mkdir src/sol/test
```

So what interface do we want our contract to have? Well, at the very least we
are going to want to implement EIP 20. For this exercise, we are going to use
[the Dappsys library](https://github.com/NexusDevelopment/dappsys) for that
purpose. The Dappsys library provides a basic token contract which we will build
on top of, as well as a function that runs tests to ensure the EIP 20 functions
work the way they should. Let's start there:

```
$ vim src/sol/test/token_test.sol

import 'dapple/test.sol';
import 'dappsys/token/token_test.sol';
import 'mytoken.sol';

contract MyTokenTest is Test {
    function testEIP20() {
        var token = new MyToken( 100  );
        var tester = new TokenTester();

        // TokenTester needs a starting balance of 100 tokens.
        token.transfer( address( tester  ), 100  );
        assertTrue( tester.runTest( token  )  );

    }

}
```

Awesome. Now we've got a test that makes sure our soon-to-exist token contract
implements basic EIP 20 functionality correctly. And if we run `dapple test`,
we'll see our new test fails brilliantly:

```
$ dapple test
Error: Unable to resolve import path 'dappsys/token/token_test.sol' in file
'/home/dev/mytoken/src/sol/test/token_test.sol'
```

Notice the path it's complaining about. Why didn't it complain about
`dapple/test.sol`? Dapple injects a couple "virtual contracts" into the build
stream. (At the time of writing, `dapple/test.sol` and `dapple/debug.sol`.)
These contracts don't exist in your project's directory, but are still
importable.

Let's address the error at hand by installing the `dappsys` package.

```
$ dapple install --save NexusDevelopment/dappsys
Cloning into 'dapple_packages/dappsys'...
```

This pulls the `dappsys` repository from the `NexusDevelopment` account on
Github into your `dapple_packages` directory and saves the dependency to your
dappfile. At this point, your dappfile looks something like:

```
layout:
  sol_sources: src/sol
  build_dir: build
dependencies:
  dappsys: NexusDevelopment/dappsys
```

Running `dapple test` again at this point yields:

```
Error: Unable to resolve import path 'mytoken.sol' in file
'/home/dev/mytoken/src/sol/test/token_test.sol'
```

To resolve this, we'll create the missing file and define our token contract:

```
$ vim src/sol/mytoken.sol

import 'dappsys/token/base.sol';

contract MyToken is DSTokenBase {
    function MyToken( uint supply  ) DSTokenBase( supply  ) {}
}
```

Running tests again, you should see something like the below in your output:

```
$ dapple test
...
MyTokenTest
  test e i p20
  Passed!
...
```

By extending the `DSTokenBase` class in the Dappsys package, we've gotten
ourselves EIP20 support for free! Let's add a little more functionality to our
token class now. For this exercise, we're going to keep track of how many tokens
get transferred between users during the lifetime of our contract.

Right below the `testEIP20` function in `src/sol/test/token_test.sol`, let's add
the following code:

```
function testTransferredCount() {
    var token = new MyToken( 100  );
    assertEq( token.transferred(), 0  ); // Starts at zero.

    var tester = new TokenTester();
    token.transfer( address( tester  ), 10  );
    assertEq( token.transferred(), 10, "Didn't register transfer."  );

}
```

And then run the tests to make sure the test fails:

```
$ dapple test
Testing...
Using local solc installation...
/home/dev/mytoken/src/sol/test/token_test.sol:17:19: Error: Member "transferred"
not found or not visible after argument-dependent lookup in contract MyToken
        assertEq( token.transferred(), 0  ); // Starts at zero.
                  ^---------------^
```

Alright, add the missing property to `src/sol/mytoken.sol`:

```
...
contract MyToken is DSTokenBase {
    uint public transferred;
...
```

```
$ dapple test
...
MyTokenTest
  test e i p20
  Passed!

  test transferred count
  LOG:  log_bytes32
  LOG:    val: Not equal!
  LOG:  log_bytes32
  LOG:    val: Didn't register transfer.
  LOG:  log_named_uint
  LOG:    key: A
  LOG:    val: 0
  LOG:  log_named_uint
  LOG:    key: B
  LOG:    val: 10
  Failed!
...
```

Okay, so our test works. Now let's turn it green:

```
import 'dappsys/token/base.sol';

contract MyToken is DSTokenBase {
    uint public transferred;

    function MyToken( uint supply  ) DSTokenBase( supply  ) {}

    function transfer( address to, uint value  ) returns ( bool ok  ) {
        transferred += value;
        return super.transfer( to, value  );

    }

    function transferFrom( address from, address to, uint value  )
        returns ( bool ok  ) {
        transferred += value;
        return super.transferFrom( from, to, value  );

        }

}
```

And now our test should pass:

```
$ dapple test
...
MyTokenTest
  test e i p20
  Passed!

  test transferred count
  Passed!
...
```

Huzzah! So what now? You'll probably want to put some sort of GUI on this, and
that probably means integrating your smart contract with Javascript. Dapple
provides a Javascript boilerplate generator that provides a wrapped Web3
Contract object to make the handoff to your frontend developers easier.

```
$ dapple build
$ ls build/
__dapplecontractmap__  __dapplesourcemap__  classes.json  js_module.js
```

You can ignore `__dapplecontractmap__` and `__dapplesourcemap__` for now.
`classes.json` might be of interest, as it contains the Solidity compiler's JSON
output. But for our purposes, we're interested in `js_module.js`.

`js_module.js` is a Browserify-able file that contains the ABI definitions and
bytecode for the contracts in your package. In particular, it exports a class
that contains:

- A `classes` object populated with Javascript classes similar to the Web3
  Contract class, with the addition of a `deploy` function which acts as a proxy
  for the contract's constructor. The keys of the object correspond to the names
  of your contracts.

- An `objects` object populated with Web3 Contract objects pointed at any
  deployed contracts in the environment specified at build time. The keys of the
  object correspond to the keys in your environment's `objects` map. The
  environment bound at build time may also be overridden by passing in an
  alternative environment object to the module's constructor.

What was that about environments in that last bullet point? Well, you can define
an `environments` key in your package's dappfile which contains an `objects` map
indicating the pre-deployed contracts that should be made available via
`js_module.js`. For example, let's say we deployed an instance of MyToken with
2.1 quadrillion tokens at the address `0xf00bar` and we wanted that to be
available to our frontend developer via the name `myBitcoinEth`.

In our dappfile we'd add the following lines:

```
environments:
    live:
        objects:
            myBitcoinEth:
                class: MyToken
                address: 0xf00bar
```

The environment you want to build with can be passed to `dapple build` via the
`-e` flag. If the flag isn't set, its value defaults to `evm`. In our example,
we want the `live` environment:

```
$ dapple build -e live
```

After that, your frontend developer can interact with your deployed contract
pretty easily:

```
var myBitcoinEth = (new require('js_module.js')()).objects.myBitcoinEth;
myBitcoinEth.transfer( '0xdeadbeef', 10 ); // Send 10 tokens to 0xdeadbeef.
```

All the environments defined in your package's dappfile also get output as JSON
files to the `environments` subdirectory of your package's build directory.
The contents of these JSON files can optionally be passed to your `js_module`
class when you instantiate it. Doing so will override the default environment
your `js_module` class was built with.
