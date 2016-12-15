Also, "migrations" can be done with Solidity: just create a `something.ds.sol` file in your contracts directory, `import "dapple/script.sol";` and inherit your script contract from `Script` and that's it. Here we will go through an example Script during which I will explain each component:
Suppose you are starting with the following environment in your Dappfile:
```
...
  morden:
    type: MORDEN
    objects:
      totalSupply:
        value: '0xffffff'
        type: uint
```

```
import "dapple/script.sol";
import "./token.sol";

contract SomeScript is Script {
  event customEvent(uint value);

  function SomeScript () {
    // deploy a new Token contract with 0xffffff tokens
    Token token = new Token(env.totalSupply);

    // export token to the local environment
    exportObject("mytoken", token);

    // static function call
    uint total = token.totalSupply();

    // log the found totalSupply
    customEvent(total);

    // get the current btc/dollar price
    uint btc_usd = system.to_uint("curl -s https://api.coindesk.com/v1/bpi/currentprice.json|jq '.bpi.USD.rate|tonumber|floor'");

    // set btc_usd price
    token.setPrice(btc_usd);

    // export the set btc/usd price to the current environment
    exportNumber("btc_usd", btc_usd);
  }
```

And now we can run this script with `dapple script run SomeScript`
which will create the following output:
```

   NEW   new Token(0xffffff) -> 0x5ef7d2b3d9509cbe1d46abb4ca163abb8302a425
   |     GAS 114961
   |     LOG owner
   |         owner: 0x1f2da94743d6d5657a6138fa77d8b4be3c185605

   GET   Token(0x5ef7d2b3d9509cbe1d46abb4ca163abb8302a425).totalSupply()
   |     RES
   |         uint256 supply = 0xffffff

   TXR   Token(0x5ef7d2b3d9509cbe1d46abb4ca163abb8302a425).setPrice(0x0262)
   |     GAS   23481
   |     LOG newPriceSet
   |         btc_usd: 0x0262

   LOG   customEvent
   |     value: 0xffffff

```

And leaves you with the new generated environment:
```
...
  morden:
    type: MORDEN
    objects:
      totalSupply:
        value: '0xffffff'
        type: uint
      mytoken:
        value: '0x5ef7d2b3d9509cbe1d46abb4ca163abb8302a425'
        type: Token[bc365dfdfd4b67086a9483f7ce915da522a252b1b0289f1b8e07c16d06a476be]
      btc_usd:
        value: 0x0262
        type: uint
```

Services, like system, are currently in experimental mode, so use them with caution. Currently only `to_uint` is implemented. This will execute anything on your local machine and inject the result back into the script contract where you can use it further.
Apart from the default use cases you can set `txoff()` or `txon()` to switch between statically calling contracts or sending transactions. (note that transaction are issued by default unless you are calling a constant function).
You can use the `setOrigin(<address>)` function to set your local address from which the following transactions should be triggered. Apart from that, feel free to use the full power of solidity. Just remember to **split your on-chain contracts and dapple-script contracts in to different files**.

Execution dapple scripts on remote chains will run a simulation first and show you the result with a confirmation before it will start the execution against real chains. On internal chains, it gets executed immediately and persistently.
