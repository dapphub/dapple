#### NatSpec debugger

It is possible to use this statements in any solidity code:
```
contract Contract {
    function send (address addr, uint value) {
        //@info user `address addr` has deposit `uint value`eth
        [...]
        //@warn something happened: "`string message`"
    }
}
```
Which on **internal** chains will produce the following log output if executed:
```
INFO:  user 0x4cfcedde6a51e5f6b47da226e50c2bb8b055ee62 has deposit 200eth
WARN:  something happened: "a strange loop"
```
On external chains (rpc/ipc connected) the statements are treated as comments and ignored during deploy.

The statements has to have one of the following prefixes:
* `//@warn`
* `//@info`
* `//@log`
* `//@debug`

Expressions which are surrounded by "\`" has to be in the following form: `<type> <reference>` while
__type__ has to be a valid solidity type and __reference__ points to an actual variable in your solidity code


### Reporter

call it with `dapple test --report`

additional to the logging output to stdout a reporter can be enabled:
In order to use the reporter, inherit from the Reporter contract:
```
contract MyTester is Reporter {
[...]
```

during the testSetup you have to specify an output file by calling the setupReporter function:

`setupReporter('doc/report.md');`

Now you can use the `//@doc` command which writes to the reporting file instead of stdout.

Also a modifier **wrapCode(string what)** is provided which wraps all output in a code block. Here an example:

```
function drawTree() wrapCode("dot") {
  uint numNodes = contract.numNodes();
  //@doc digraph A {
  for(var i=1; i<numNodes; i++) {
    uint parent = contract.getParentForNode(i);
    //@doc node_`uint parent` -> node_`uint i`;
  }
  //@doc }
}
```

Will produce the following code in `doc/report.md`:
```
` ``{dot}
digraph A {
  node_0 -> node_1;
  node_0 -> node_2;
  node_2 -> node_3;
}
` ``
```

with a custom post-processor (like knitr) wrapped code can be further evaluated. In this case to a graphviz image:
![](https://chart.googleapis.com/chart?chl=+digraph+A+%7B%0D%0A++++++node_0+-%3E+node_1%3B%0D%0A++node_0+-%3E+node_2%3B%0D%0A++node_2+-%3E+node_3%3B%0D%0A+%7D%0D%0A++++++++&cht=gv)

