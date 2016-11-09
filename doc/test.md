# Tests
Dapple provides a VM test harness so you can write your tests directly in Solidity. This is less flexible and sometimes more verbose than writing tests in the harness language, but the lack of a context switch makes writing unit tests more pleasant for the developer.

## Example
Suppose you want to test this contract:

```js
contract MyRegistry {
    address public _creator;
    mapping(bytes32=>bytes32) _values;
    event Set(bytes32 indexed key, bytes32 value);
    function MyRegistry() {
        _creator = msg.sender;
    }
    function set(bytes32 key, bytes32 value) {
        if( msg.sender != _creator ) {
            throw;
        }
        _values[key] = value;
        Set(key, value);
    }
    function get(bytes32 key) constant returns (bytes32 value) {
        return _values[key];
    }
}
```

A dapple test might look like this:

```js
import 'dapple/test.sol'; // virtual "dapple" package imported when `dapple test` is run
import 'myregistry.sol';

// Deriving from `Test` marks the contract as a test and gives you access to various test helpers.
contract MyRegistryTest is Test {
    MyRegistry reg;
    Tester proxy_tester;
    // The function called "setUp" with no arguments is
    // called on a fresh instance of this contract before
    // each test. TODO: Document when to put setup logic in
    // setUp vs subclass constructor when writing Test subclasses
    function setUp() {
        reg = new MyRegistry();
        proxy_tester = new Tester();
        proxy_tester._target(reg);
    }
    function testCreatorIsCreator() {
        assertEq( address(this), reg._creator() );
    }
    function testFailNonCreatorSet() {
        MyRegistry(proxy_tester).set("no", "stop");
    }
    event Set(bytes32 indexed key, bytes32 value);
    function testSetEvent() {
        expectEventsExact(reg);
        Set("hello", "hi");
        reg.set("hello", "hi");
    }
}
```
## Test Exeptions
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
## Test Events

This test feature tests the exact emitted event sequence produced by a transaction.



#### Example
A contract which implements a set of Events:

```
contract EventDefinitions {
    event info(bytes data);
    event warn(bytes data);
}

contract Contract is EventDefinitions {
[...]
  function fire() {
    info("ok");
    warn("warning");
  }
}
```

In order to assert that in a scenario a correct sequence of events is emitted,
one can bind the events of contract instance with `expectEventsExact( <target> )`.
After a binding, the test function has to emit the expected events in the same
order in which they are expect in the bound instance.
This asserts the correct event **types**, correct **inputs** for a type and the 
correct **order** of emits. Also, expected events that are not emitted and **unexpected** 
events result in a test failure.

The easiest way to use this is to follow the pattern of defining events in their own
container type like `EventDefinitions`, then have both the implementation and the tester
derive from it.

##### passing example
The following shows a passing test:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    info("ok");
    warn("warning");
    target.fire();
  }

}
```

##### failing examples
The following test will fail because of the wrong **order** of the events:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    warn("warning");
    info("ok");
    target.fire();
  }

}
```

The following test will fail because of the wrong **type** of the events:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    info("ok");
    info("warning");
    target.fire();
  }

}
```

The following test will fail because of the wrong **content** of the events:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    info("ok");
    warn("error");
    target.fire();
  }

}
```

The following test will fail because an **unexpected** event is emited:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    info("ok");
    target.fire();
  }

}
```

The following test will fail because an expected event is **not emited**:

```
contract MyTest is Test, EventDefinitions {

  [...]

  function testEvents () {
    Contract target = new Contract();
    expectEventsExact( target );
    info("ok");
    warn("warn");
    info("success");
    target.fire();
  }

}
```

# Reference

##Modifiers

#####tests(bytes32 what)

This modifier allows you to specify the function you intend to test as a string next to your testcase name.

**Example:**

```
contract MyTest is Test {
  
  [...]
  
  function testUnsetNullValue() tests("unset") {
    DSNullableMap map = new DSNullableMap();
    assertTrue(map.unset("test"));
  }

}
```

#####logs_gas( )

This modifier will cause the consumed gas to be logged as an event when you run your test case.

##Assertions Functions

Any `bytes32 error` parameter listed below will be logged to stdout if the assertion fails.

#####assertTrue(bool what)

#####assertTrue(bool what, bytes32 error)

#####assertFalse(bool what)

#####assertFalse(bool what, bytes32 error)

#####assertEq(bool a, bool b)

#####assertEq(bool a, bool b, bytes32 err)

#####assertEq(uint a, uint b)

#####assertEq(uint a, uint b, bytes32 err)

#####assertEq(int a, int b)

#####assertEq(int a, int b, bytes32 err)

#####assertEq(address a, address b)

#####assertEq(address a, address b, bytes32 err)

#####assertEq0(bytes a, bytes b)

#####assertEq0(bytes a, bytes b, bytes32 err)

#####assertEq<N\>(bytes<N\> a, bytes<N\> b)

<N\> in this case can be any number between 1 and 32. For example:

`assertEq8(bytes8 a, bytes8 b)`

#####assertEq<N\>(bytes<N\> a, bytes<N\> b, bytes32 err)

#####assertEq(bytes memory _a, bytes memory _b)

#####assertEq(string memory a, string memory b)

##Logging events

In addition to Dapple's [logging framework](http://dapple.readthedocs.io/en/master/logging/), test contracts have access to events that are defined for the purposes of logging.

#####log_bool(bool val)

#####log_named_bool(bytes32 key, bool val)

#####log_uint(uint val)

#####log\_named_uint(bytes32 key, uint val)

#####log_int(int val)

#####log\_named_int(bytes32 key, int val)

#####log_address(address val)

#####log\_named_address(bytes32 key, address val)

#####log_bytes(bytes val)

#####log\_named_bytes(bytes32 key, bytes val)

#####log_bytes<N\>(bytes<N\> val)

<N\> in this case can be any number between 1 and 32. For example:

`log_bytes8(bytes8 val)`

#####log\_named_bytes<N\>(bytes32 key, bytes<N\> val)

#####log\_named_string(string key, string val)
