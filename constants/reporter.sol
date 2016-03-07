import "dapple/dapple_log.sol";

contract Reporter is DappleLogger {

  modifier wrapCode(string what) {
    __startBlock(what);
    _
    __stopBlock();
  }

  event __startBlockE(string what);
  event __stopBlockE();
  event setupReporter(string where);

  function __startBlock(string what) {
    __startBlockE(what);
  }

  function __stopBlock() {
    __stopBlockE();
  }
}
