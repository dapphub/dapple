## Test Errors
This test feature captures thrown Errors (VM exceptions) of a transaction.
All test functions which are starting with `testThrow`, `testFail` or `testError`
are expected to crash: a `throw;` is expected somewhere in the scenario.

### Example

Suppose the following contract:
```
contract Contract {
  [...]

  function crash() {
    throw;
  }

  function passing() {
    // nothing
  }
}
```

#### passing

The following shows a passing test, because an expected throw actually happens:
```
contract MyTest is Test {
  function testThrow() {
    Contract target = new Contract();
    target.crash();
  }
}
```

#### failing

The following test fails, because the function name has a **wrong prefix**:
```
contract MyTest is Test {
  function testCrash() {
    Contract target = new Contract();
    target.crash();
  }
}
```

The following test fails, because **no expected** throw happens:
```
contract MyTest is Test {
  function testError() {
    Contract target = new Contract();
    target.passing();
  }
}
```
