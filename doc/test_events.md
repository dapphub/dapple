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
  function call(){
    info("ok");
    warn("warning");
  }
}
```

In order to assert that in a scenario a correct sequence of events is emitted
one can bind the events of contract instance with `expectEventsExact( <target> )`.
After a binding, the test function has to emit the expected events in the same
order in which they are expect in the bound instance.
This assert the correct event **types**, correct **inputs** for a type and the 
correct **order** of emits. Also expected but **not emitted** and **unexpected** 
events are leading to a test fail.

The easiest way to use this is to inherit the test-contract from the target 
contract `EventDefnitons`.

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
    target.call();
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
    target.call();
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
    target.call();
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
    target.call();
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
    target.call();
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
    target.call();
  }

}
```
