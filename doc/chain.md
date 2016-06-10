**DISCLAMER: The chain feature is currently in development and is highly unstable.**

#### Chain

Dapple hash a build in internal blockchain. It can either start a new by creating
a new genesis block or "fork of" the current mainnet state.

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
Run a RPC server. You can interact with it's current state through `localhost:8545`
