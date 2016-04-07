Dapple understands a simple domain specific language which allows you to write
scripts to automatically set up contract systems on a specified chain.
This includes deploying and calling contracts, logging values, persistently
saving values, importing values from the current environment and dependant packages.

## How to
A script is usually written either to the package root or a `scripts` directory.
It can be called with `dapple run <script> [--force] [--no-simulation] [options]`

If only a specific expression needs to be executed it can be called without a 
script with `dapple step <string> [options]`.

The script is always executed against an environment which is specified in the users local `~/.dapplerc`.
This happens in two steps: First the execution is **simulated** against the internal chain.
This catches errors in the script. If an error occurs during the simulation,
dapple throws an error and stops the execution. The `--force` flag can be specified,
to force dapple to continue the execution despite an error.

The simulation also gathers data about the script such as the exact gas prices for each
operation. This prevents any errors which could be caused by wrong gas parameters.
Only after after a simulation is executed successfully it is run against the specified environment.
The simulation can also be omitted by run a script with the `--no-simulation` flag.

Every operation, which actually triggers a chain state change (deploy, call) is
verified after a standard confirmation time of 4 Blocks.

### Operations

#### deploy
```
new <class name> [. gas(<gas>) |. value(<value>) ]* ( <args> )
```
This deploys the class "Contract". A deploy statement is always indicated by
the keyword `new` followed by a class name. The contract class has to be available
in one of the contract source files of the dapple project.
An custom amount of gas and value can be passed during the deploy by specifying
`.gas(<gas>)` and value `.value(<value>)`.

##### example
```
new Contract.value(1000000)("contract name")
```
#### call
```
<object>.<function name> [. gas(<gas>) | .value(<value>)]* ( <args> )
```
This send a transaction to an object by calling the specified function name.
Gas and Value can be passed much like during a deploy.
If the function is static, the call don't triggers a transaction and returns a value
which can be saved to a variable.

##### example
```
object.setName.value(100000)("name")
```

#### import
```
import [pkg .]* <var>
```
This imports a variable out of the current environment of the specified package tree.

##### example
```
import pkg1.pkg2.contract
```
#### export
```
export <var>
```
This persistently saves a variable out of the current script scope to
the current environment in the dappfile.

##### example
```
var var = 2
export var
```

#### log
```
var fortytwo = 42
log fortytwo
```
This logs an arbitrary variable to stdout.


### Example

The script `./deployscript`
```
// import envObject from the current environment
import envObject

// import pkgObject from the current environment of the package "pkg"
import pkg.pkgObject

// deploy a new ContractA instance
var internalObject = new ContractA()

// string for later use
var internalString = "objectName"

// deploy a new ContractB instance with two addresses as parameters
var externalObject = new ContractB( pkg.pkgObject, envObject, internalObject )

// call a function on the contract
externalObject.setName(internalString)

// persistantly save a value
export externalObject
```

run with:
`dapple run ./deployscript -e morden`

will produce the following output:
```
DEPLOYED: ContractA = 0x89e020ed6a30e8d5a05f6c6ee77a81c46934ba25
GAS COST: 510111 for "new ContractA"
Waiting for 4 confirmations: .... confirmed!
DEPLOYED: ContractB = 0x17d41b0d0e290f9c6be4c610b7db654464ee6425
GAS COST: 1666288 for "new ContractB"
Waiting for 4 confirmations: .... confirmed!
CALLED: ContractB("externalObject").setName(internalString)
GAS COST: 18348 for "call ContractB.setName(internalString)"
Waiting for 4 confirmations: .... confirmed!
```

and save the exports to the current dappfile under the executed environment:
The dappfile `/dappfile`
```
[...]
environments:
  morden:
    objects:
      externalObject:
        class: ContractB
        address: '0x17d41b0d0e290f9c6be4c610b7db654464ee6425'
[...]
```

## Roadmap
The following planned features will get implemented next (not ordered):

* Simulating the deployment on a real chain fork.
* assertions
* Type checking the script on compile time + type inference.
    * This will reduce possible errors done while writing a script.
* Call and return values from non-static functions.
* Call functions which return multiple values
* Saving and resuming a scripts state on every step.
    * This prevents losing any information during a deploy.
* Managing different addresses out of the coinbase which are performing operations.
* Script subroutines and importing/calling the subroutinges from packages.
