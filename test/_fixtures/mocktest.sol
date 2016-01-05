contract Test {
    bool public failed;

    event logs(bytes val);

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
