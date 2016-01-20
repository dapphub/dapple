// Example_Test is Test {
contract <%= testClassName %> is Test {
    // Example target;
    <%= className %> target;
    function setUp() {
        // target = new Example();
        target = new <%= className %>();
    }
    function testSomething() {
    }
}
