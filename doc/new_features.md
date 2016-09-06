## Dapple 0.8

This should provide an overview over the new features:

* dapple chain
* dapple script
* nexus-service-sidechain

### dapple chain
On the heard of dapple chain lies the chain environment which
includes
* **chain type** (e.g. MORDEN, ETC, ETH or internal)
* on external chain types, the **network** endpoint
* **context** which includes a set of typed objects
* settings
  * default account
  * confirmation blocks
  * ...

> `dapple chain` is a Tool to manage chain environments.

Lets have a look on its capabilities:
```
dapple status
dapple chain new
dapple chain rm
dapple chain ls
dapple chain checkout <name>
```

Dapple new will launch a wizard which will guide you through the setup of a new chainenv:

```
$ dapple chain new
? Chain name morden
? Select chain type (Use arrow keys)
❯ remote rpc
  internal
  fork ETH
  fork ETC
  fork MORDEN
```
On the second step you will get asked about the type. Choose
internal if you want to start an internal chain from scratch.
You can also choose to fork of the head state of ETH, ETC or MORDEN chains through our dapphub service. Forked chains will become internal chains. Note that dapple has an internal light client implementation - forked chains will lazy-load the state and appear, as if you would work on the real chain. But lets continue by selecting remote rpc:

```
? Select chain connection remote
? Host localhost
? Port 8545
Found a MORDEN chain at localhost:8545 !
? default account: 0x1f2da94743d6d5657a6138fa77d8b4be3c185605
? Do you want to save this chain connection globally? No
```

Now we can list, remove or checkout chains:
```
$ dapple chain ls
   master  #0
 * morden  (MORDEN)
```

Additionally there are two experimental commands provided:
```
  dapple chain server
  dapple chain fake <address>
```

If you are on an internal(or forked) chain, you can use server to launch an rpc server on `localhost:8545` and interact with your chain outside of dapple.

You can use `fake <address>` command to fake the ownership of a certain address. From this point on, all transactions from the faked address will get accepted. This is useful for integration/scenario tests or just messing up with the current state.

## dapple test
Note that dapple chain will affect the testing behaviour: if you are on a remote rpc chain with known type (MORDEN, ETH, ETC) running `dapple test` will instantly create a temporary fork on the current head of the chain type and run the test against this fork, hence tests on remote chains are integration tests by default and you can use existing addresses inside your tests to access the current state of the chain-type. No transaction will get leaked to the real network. On CUSTOM remote rpc chains `dapple test` cannot fork, yet, therefore tests are unit tests by default. On internal(or forked) chain-types dapple-test is temporary and doesn't save the current state.

## dapple script
Also "migrations" is Solidity: just create a `something.ds.sol` file in your contracts directory, `import "dapple/script.sol";` and inherit your script contract from `Script` and thats it. Here we will go through an example Script during which I will explain each component:

```
import "dapple/script.sol";
import "./token.sol";

contract SomeScript is Script {
  function SomeScript () {
    // deploy a new Token contract with 1000 tokens
    Token token = new Token(10000);

    // export token to the local environment
    exportObject("mytoken", token);

    // static function call
    uint total = token.totalSupply();

    // export the total supply to the current environment
    exportNumber("totalsupply", total);

    // get the current btc/dollar price
    uint btc_usd = system.to_uint("curl -s https://api.coindesk.com/v1/bpi/currentprice.json|jq '.bpi.USD.rate|tonumber|floor'");

    // set btc_usd price
    token.setPrice(btc_usd);
  }
```

Services, like system, are currently in experimental mode, so use them with caution. Currently only `to_uint` is implemented. This will execute anything on your local machine and inject the result back into the script contract where you can use it further.
Apart from the default use cases you can set `txoff()` or `txon()` to switch between statically calling contracts or sending transactions. (note that transaction are issued by default unless you are calling a constant function).
You can use the `setOrigin(<address>)` function to set your local address from which the following transactions should be triggered. Apart from that, feel free to use the full power of solidity. Just remember to **split your on-chain contracts and dapple-script contracts in to different files**.

Execution dapple scripts on remote chains will run a simulation first and show you the result with a confirmation before it will start the execution against real chains. On internal chains, it gets executed immediately and persistently.
