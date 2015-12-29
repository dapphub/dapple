import 'dapple/test.sol';

contract ExampleTest is Test {
    Example e;
    function setUp() {
        e = new Example(10);
    }
    function testLogs() {
        logs("testing");
    }
    function testFailure() {
        assertTrue( false );
    }
}
