contract Test {
    bool public failed;

    event logs(bytes val);
    
    event eventListener(address _target, bool exact);
    
    function expectEventsExact(address _target) {
      eventListener(_target, true);
    }

    
    function fail() {
        failed = true;
    }

    function assertTrue(bool what) {
        if ( !what ) {
            logs("assertTrue was false");
            fail();
        }
    }
}

contract Pass is Test {
    function testPass() {
        assertTrue(true);
    }
}

contract Fail is Test {
    function testFail() {
        assertTrue(false);
    }
}

contract Throw is Test {
    function testThrowSomething() {
      throw;
    }
}

contract NotThrow is Test {
    function testThrowSomething() {
      assertTrue(true);
    }
}

contract EventDefinitions {
    event foo(bytes what);
    event bar(bytes what);
}

contract MyContract is EventDefinitions {
    
    function throwFoo() {
      foo("bar");
    }
    
    function throwFooBar() {
      foo("bar");
      bar("bar");
    }
    
    function noevent() {
        // nothing!
    }
}

contract Event is Test, EventDefinitions {
    MyContract _target;
    
    function setUp() {
        _target = new MyContract();
    }

    function testEvent() {
      expectEventsExact( _target );
      foo("bar");
      _target.throwFoo();
    }
}

contract Event2 is Test, EventDefinitions {
    MyContract _target;
    
    function setUp() {
        _target = new MyContract();
    }

    function testEvent() {
      expectEventsExact( _target );
      foo("bar");
      bar("bar");
      _target.throwFooBar();
    }
}

contract EventFail is Test, EventDefinitions {
    MyContract _target;
    
    function setUp() {
        _target = new MyContract();
    }

    function testEvent() {
      expectEventsExact( _target );
      foo("baz");
      _target.throwFoo();
    }
}

contract EventFail2 is Test, EventDefinitions {
    MyContract _target;
    
    function setUp() {
        _target = new MyContract();
    }

    function testEvent() {
      expectEventsExact( _target );
      bar("bar");
      foo("bar");
      _target.throwFooBar();
    }
}
