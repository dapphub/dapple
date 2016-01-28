contract Test {
    bool public failed;

    event logs(bytes val);
    
    event eventListener(bytes32 name);
    
    modifier expectEvent(bytes32 name) {
      eventListener( name );
      _
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
    function testThrow() {
      throw;
    }
}

contract NotThrow is Test {
    function testThrow() {
      assertTrue(true);
    }
}

contract Event is Test {
  
    event foo(bytes val);

    function testEvent() expectEvent("foo") {
      foo("uiuiui");
      assertTrue(true);
    }
}


contract TwoEvent is Test {
  
    event foo(bytes val);
    event bar(bytes val);

    function testEvent() expectEvent("foo") expectEvent("bar") {
      foo("uiuiui");
      bar("uiuiui");
      assertTrue(true);
    }
}


contract NoEvent is Test {
  
    event foo(bytes val);

    function testWhatever() expectEvent("foo") expectEvent("bar") {
      assertTrue(true);
    }
}


contract NoSecondEvent is Test {
  
    event foo(bytes val);
    event bar(bytes val);

    function testWhatever() expectEvent("foo") expectEvent("bar") {
      foo("uiuiui");
      assertTrue(true);
    }
}
