import 'dapple/test.sol';

contract Fails is Test {
  function test1Fails() {
    assertTrue(false);
  }

  function test2Fails() {
    assertTrue(false);
  }
}

contract FailsToo is Test {
  function test3Fails() {
    assertTrue(false);
  }
}
