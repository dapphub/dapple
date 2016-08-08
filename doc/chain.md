
# hypothetical chain states

Dapple allows you with its test framework to unit tests each part of your dApp
in isolation before deploying it. But in complex systems dApps rarely live in
isolation. Instead they integrate with a rich subset of other dApps existing on
ethereum's live network. The dapple-chain feature set allows you to test the
integration of dApps into the real ethereum state by pretending to extend
ethereum's livenet state. Alongside reasoning about *hypothetical chain states*
is now possible.

Dapple-Chain provides lazy-loading with a pseudo light client implementation. You can fork of and work on the full ethereum blockchain **without having to download the
blockchain** to your machine which lowers the entrance barrier for newcomers significantly and makes working with dapple light-weight.

Dapples lazy loading be will be extended with the ethereum's official [light client proticol](https://github.com/ethereum/wiki/wiki/Light-client-protocol) once it's ready.

## Tutorial

For a first integration test we will test [DSEthToken@0x992c64ac907ef9e531e7ff8d06cec599778a0e72](https://github.com/nexusdev/dappsys/blob/04451acf23f017beecb1a4cad4702deadc929811/contracts/token/eth_wrapper.sol) which is
provided by the [ Dappsys ](https://github.com/nexusdev/dappsys) framework.

First we initialize a new git and dapple project and install dappsys:
```
git init
dapple init
git submodule add git@github.com:nexusdev/dappsys.git dapple_packages/dappsys
```

Our integration test should call the on-chain contract and display correctly its
total supply. For this we create a new dapple project with a small test contract:
```
// contracts/test.sol
import "dapple/test.sol";
import "dappsys/token/eth_wrapper.sol";


contract IntegrationTest is Test {
  function testEchoCall() {
    DSEthToken dsEthToken = DSEthToken(0xecf8f87f810ecf450940c9f60066b4a7a501d6a7);

    // this will give us the total supply of tokens
    uint value = dsEthToken.totalSupply();
    //@log total Supply is: `uint value`

    // this will give us the balance of an address
    uint value2 = dsEthToken.balanceOf(0x9f73bc871764c879fd9e0f524278373fa7875068);
    //@log a balance: `uint value2`

    // this will give us the balance of the address 0x00.00
    uint value3 = dsEthToken.balanceOf(0x0);
    //@log 0 balance: `uint value3`


  }
}
```
Also we need to work on the livenet chain:
```
$ dapple chain branch
 * master   #0
   livenet  #1788860

$ dapple chain checkout livenet
switched to livenet
```

Now we can inspect our current branch with:
```
$ dapple chain status
genesis: d4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3
stateRoot: 0x52324375f49843b61fc2ca693d33ca4037b5aeebe07c32867e95de9bacba773d

branch: livenet

fork root: 1788860
height: 1788860

dev mode: false

default account:
0x0000000000000000000000000000000000000000

faked accounts:
0x0000000000000000000000000000000000000000
```
As you can see here we forked of at block 1788860. Now we run our test:
```
$ dapple test --report
Testing...

IntegrationTest
  test echo call
  LOG:  total Supply is: 463200000000000000000
  LOG:  balance: 77300000000000000000
  LOG:  0 balance: 0
  Passed!


Summary
  Passed all 1 tests!
```

Awesome: there is a total of 463.2 eth and the balance of an address is 77.3eth 
and there were no tokens burned (e.g. 0x0 has no tokens).
If we look again at the stats(`dapple chain status`) we see that they didn't change.
This is because `dapple test` don't affect the persistent state of the branch.
Now we simulate a scenario where the address `0x9f73bc871764c879fd9e0f524278373fa7875068`
decides to burn all his ether. First we have to make sure or dapple project
is aware of the DSEthToken contract, by including it in our local dappfile:
```
environments:
  default:
    objects:
      eth_token:
        class: DSEthToken
        address: '0xecf8f87f810ecf450940c9f60066b4a7a501d6a7'
```

Then we write a small dapple-script:
```
// ./send.ds
import eth_token
eth_token.transfer(0,77300000000000000000)
```

Fake the ownership of our target address:
```
$ dapple chain fake 0x9f73bc871764c879fd9e0f524278373fa7875068
```

And execute it:
```
$ dapple run send.ds -s
Deploying to environment "default"...
Using internal EVM...
Connected to RPC client, block height is 1788860
CALLED: DSEthToken("0xecf8f87f810ecf450940c9f60066b4a7a501d6a7").transfer(0,77300000000000000000)
GAS COST: 49793 for "call DSEthToken.transfer(0,77300000000000000000)"

.
  Successfully deployed!
```

If we look now at our stats (`dapple chain status`), we see that our block height
increased by one block. Also when we execute our test again to test the new
balances, we see that the money is gone!
```
$ dapple test --report
Testing...

IntegrationTest
  test echo call
  LOG:  total Supply is: 463200000000000000000
  LOG:  balance: 0
  LOG:  0 balance: 77300000000000000000
  Passed!
```



## Spec

#### Chain

Dapple has a build in blockchain. It can either start a new by creating
a new genesis block or "fork of" the current livenet state.

`dapple test` will run without leaving a state change on top of the current state.
You can persistently change the changes caused by the test with the `--persistent`
flag.

`dapple run` executed on the internal environment will always cause a persisent
state change!


### Usage
```
    dapple chain status                 print the current status of the chain

    dapple chain branch                 list all aviable branches

    dapple chain fork <name>            fork chain from the current HEAD
        <name>                          new branch name

    dapple chain checkout <name>        switch to another branch
        <name>                          branch name

    dapple chain log                    logs all blocks and transactions since the fork root

    dapple chain server                 start an rpc server on the current branch

    dapple chain fake <address>         pretend you have the private keys over the given address
        <address>                       address, you want to fake ownership of
```

#### Status
Prints the relevant information about the current chain state:
```
$ dapple chain status
genesis: 966a9507fc0a9579a926de84558c99ad47077d72e021406c601d751127cc03c3
stateRoot: 0xab07efc7c692bca7473b944f96343df9c670c3cfa42fb050d0e86e7679c5ef56

branch: master

fork root: 0x601f6c46323d6372fc3ac90f277a55aa5e482068cc396143069a91d6dba6483b
height: 7
```

#### Branch
List all branches:
```
 * master   #7
   livenet  #1650000
```

#### Fork
Fork of the current state to a new branch.
```
$ dapple chain fork omg
Forked master to omg

$ dapple chain branch
   master   #7
   livenet  #1650000
 * omg      #7
```


#### Checkout
Switch to another branch
```
$ dapple chain checkout livenet
switched to livenet

$ dapple chain branch
   master   #7
 * livenet  #1650000
   omg      #7
```

#### Log
Logs all relevant information since the fork-root. Such as:
* blocks
* transactions
* contract deployments
* function calls

#### Server
**THIS IS CURRENTLIN IN WIP EXPERIMENTAL MODE, NOT ALL RPC FEATURES ARE FULLY
IMPLEMENTED**
Run a RPC server. You can interact with it's current state through `localhost:8545`

#### Fake
This allows faking the ownership of an address. With a faked ownership you can
send transactions from any address and change the chain-state arbitrary.
Note here that in case of an illegal operation like faked transaction, dapples
chain state will transition in to a **dev-mode** which will stay as an inherent 
property for the next changes. In dev-mode it won't be possible to merge to
the real ethereum chain as invalid signed transaction will be rejected by the
network.
The default address is always `0x0000000000000000000000000000000000000000`.

```
$ dapple chain status # previous state
...
default account:
0x0000000000000000000000000000000000000000

faked accounts:
0x0000000000000000000000000000000000000000
...
$ dapple chain fake 0xffffffffffffffffffffffffffffffffffffffff

$ dapple chain status # new state
...
default account:
0xffffffffffffffffffffffffffffffffffffffff

faked accounts:
0x0000000000000000000000000000000000000000
0xffffffffffffffffffffffffffffffffffffffff
...
```


## TODOs

* remote push/ pull to dapphub service
    Similarly to a git repository one might want to share his state with others.
    This feature set should provide the exchange of hypothetical chain states,
    preferably in a decentral manner.

* account management
    In order to sign real transactions, some notion of account management has
    to be implemented. This should cover (1) adding accounts, (2) selecting
    accounts/ default, (3) removing accounts.

* merging
    To merge two chain states to one. This also includes releasing correct
    signet transactions to the livenet.

* improved livenet interface.
    It should be possible to fork the livenet chain on any arbitrary block,
    as well as synchronize the forked chain.

* improved logger
    Put more Mojo into the logger.




