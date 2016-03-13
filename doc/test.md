Dapple provides a VM test harness so you can write your tests directly in Solidity. This is less flexible and sometimes more verbose than writing tests in the harness language, but the lack of a context switch makes writing unit tests more pleasant for the developer.

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
    // each test. 
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

Further docs:

[Testing Exceptions](https://github.com/nexusdev/dapple/blob/master/doc/test_errors.md)
[Testing Events](https://github.com/nexusdev/dapple/blog/master/doc/test_events.md)

