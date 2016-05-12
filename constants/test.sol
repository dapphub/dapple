import 'dapple/debug.sol';

contract Tester {
  address _t;
  function _target( address target ) {
    _t = target;
  }
  function() {
    if(!_t.call(msg.data)) throw;
  }
}

contract Test is Debug {
    bytes32 testname;
    address me;
    // easy way to detect if its a test from the abi
    bool public IS_TEST;
    bool public failed;
    function Test() {
        me = address(this);
        IS_TEST = true;
    }

    modifier tests(bytes32 what) {
        _
    }
    modifier logs_gas() {
        var __GAS_OVERHEAD = 0; // TODO
        var __startgas = msg.gas;
        _
        var __endgas = msg.gas;
        log_named_uint("gas", (__startgas - __endgas) - __GAS_OVERHEAD);
    }

    event eventListener(address _target, bool exact);

    function expectEventsExact(address _target) {
      eventListener(_target, true);
    }

    function fail() {
        failed = true;
    }
    function assertTrue(bool what) {
        if( !what ) {
            logs("assertTrue was false");
            fail();
        }
    }
    function assertTrue(bool what, bytes32 error) {
        if( !what ) {
            logs("assertTrue was false");
            log_bytes32(error);
            fail();
        }
    }
    function assertFalse(bool what) {
        if( what ) {
            logs("assertFalse was true");
            fail();
        }
    }
    function assertFalse(bool what, bytes32 error) {
        if( what ) {
            logs("assertFalse was true");
            log_bytes32(error);
            fail();
        }
    }
    function assertEq0(bytes a, bytes b) {
        var len = a.length;
        var ok = true;
        if( b.length == len ) {
            for( var i = 0; i < len; i++ ) {
                if( a[i] != b[i] ) {
                    ok = false;
                }
            }
        } else {
            ok = false;
        }
        if( !ok ) {
            log_bytes32("failed assertEq(bytes)");
            fail();
        }
    }
    function assertEq0(bytes a, bytes b, bytes32 err) {
        var len = a.length;
        var ok = true;
        if( b.length == len ) {
            for( var i = 0; i < len; i++ ) {
                if( a[i] != b[i] ) {
                    ok = false;
                }
            }
        } else {
            ok = false;
        }
        if( !ok ) {
            log_bytes32("failed assertEq(bytes)");
            log_bytes32(err);
            fail();
        }
    }

    /*[[[cog
    import cog
    types = ['bool', 'uint', 'int', 'address']
    for i in range(32):
        types.append('bytes'+str(i+1))
    for type in types:
        fname = "assertEq"
        if type.startswith("bytes") and type != "bytes":
            fname += type.strip("bytes")
        cog.out("function " + fname + "(")
        cog.outl(type + " a, " + type + " b, bytes32 err) {")
        cog.outl("    if( a != b ) {");
        cog.outl("        log_bytes32('Not equal!');")
        cog.outl("        log_bytes32(err);")
        cog.outl("        log_named_" + type + "('A', a);")
        cog.outl("        log_named_" + type + "('B', b);")
        cog.outl("        fail();")
        cog.outl("    }")
        cog.outl("}")

        cog.out("function " + fname + "(")
        cog.outl(type + " a, " + type + " b) {")
        cog.outl("    if( a != b ) {");
        cog.outl("        log_bytes32('Not equal!');")
        cog.outl("        log_named_" + type + "('A', a);")
        cog.outl("        log_named_" + type + "('B', b);")
        cog.outl("        fail();")
        cog.outl("    }")
        cog.outl("}")
    ]]]*/

    function assertEq(bool a, bool b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bool('A', a);
            log_named_bool('B', b);
            fail();
        }
    }
    function assertEq(bool a, bool b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bool('A', a);
            log_named_bool('B', b);
            fail();
        }
    }
    function assertEq(uint a, uint b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_uint('A', a);
            log_named_uint('B', b);
            fail();
        }
    }
    function assertEq(uint a, uint b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_uint('A', a);
            log_named_uint('B', b);
            fail();
        }
    }
    function assertEq(int a, int b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_int('A', a);
            log_named_int('B', b);
            fail();
        }
    }
    function assertEq(int a, int b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_int('A', a);
            log_named_int('B', b);
            fail();
        }
    }
    function assertEq(address a, address b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_address('A', a);
            log_named_address('B', b);
            fail();
        }
    }
    function assertEq(address a, address b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_address('A', a);
            log_named_address('B', b);
            fail();
        }
    }
    function assertEq1(bytes1 a, bytes1 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes1('A', a);
            log_named_bytes1('B', b);
            fail();
        }
    }
    function assertEq1(bytes1 a, bytes1 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes1('A', a);
            log_named_bytes1('B', b);
            fail();
        }
    }
    function assertEq2(bytes2 a, bytes2 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes2('A', a);
            log_named_bytes2('B', b);
            fail();
        }
    }
    function assertEq2(bytes2 a, bytes2 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes2('A', a);
            log_named_bytes2('B', b);
            fail();
        }
    }
    function assertEq3(bytes3 a, bytes3 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes3('A', a);
            log_named_bytes3('B', b);
            fail();
        }
    }
    function assertEq3(bytes3 a, bytes3 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes3('A', a);
            log_named_bytes3('B', b);
            fail();
        }
    }
    function assertEq4(bytes4 a, bytes4 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes4('A', a);
            log_named_bytes4('B', b);
            fail();
        }
    }
    function assertEq4(bytes4 a, bytes4 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes4('A', a);
            log_named_bytes4('B', b);
            fail();
        }
    }
    function assertEq5(bytes5 a, bytes5 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes5('A', a);
            log_named_bytes5('B', b);
            fail();
        }
    }
    function assertEq5(bytes5 a, bytes5 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes5('A', a);
            log_named_bytes5('B', b);
            fail();
        }
    }
    function assertEq6(bytes6 a, bytes6 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes6('A', a);
            log_named_bytes6('B', b);
            fail();
        }
    }
    function assertEq6(bytes6 a, bytes6 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes6('A', a);
            log_named_bytes6('B', b);
            fail();
        }
    }
    function assertEq7(bytes7 a, bytes7 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes7('A', a);
            log_named_bytes7('B', b);
            fail();
        }
    }
    function assertEq7(bytes7 a, bytes7 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes7('A', a);
            log_named_bytes7('B', b);
            fail();
        }
    }
    function assertEq8(bytes8 a, bytes8 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes8('A', a);
            log_named_bytes8('B', b);
            fail();
        }
    }
    function assertEq8(bytes8 a, bytes8 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes8('A', a);
            log_named_bytes8('B', b);
            fail();
        }
    }
    function assertEq9(bytes9 a, bytes9 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes9('A', a);
            log_named_bytes9('B', b);
            fail();
        }
    }
    function assertEq9(bytes9 a, bytes9 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes9('A', a);
            log_named_bytes9('B', b);
            fail();
        }
    }
    function assertEq10(bytes10 a, bytes10 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes10('A', a);
            log_named_bytes10('B', b);
            fail();
        }
    }
    function assertEq10(bytes10 a, bytes10 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes10('A', a);
            log_named_bytes10('B', b);
            fail();
        }
    }
    function assertEq11(bytes11 a, bytes11 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes11('A', a);
            log_named_bytes11('B', b);
            fail();
        }
    }
    function assertEq11(bytes11 a, bytes11 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes11('A', a);
            log_named_bytes11('B', b);
            fail();
        }
    }
    function assertEq12(bytes12 a, bytes12 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes12('A', a);
            log_named_bytes12('B', b);
            fail();
        }
    }
    function assertEq12(bytes12 a, bytes12 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes12('A', a);
            log_named_bytes12('B', b);
            fail();
        }
    }
    function assertEq13(bytes13 a, bytes13 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes13('A', a);
            log_named_bytes13('B', b);
            fail();
        }
    }
    function assertEq13(bytes13 a, bytes13 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes13('A', a);
            log_named_bytes13('B', b);
            fail();
        }
    }
    function assertEq14(bytes14 a, bytes14 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes14('A', a);
            log_named_bytes14('B', b);
            fail();
        }
    }
    function assertEq14(bytes14 a, bytes14 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes14('A', a);
            log_named_bytes14('B', b);
            fail();
        }
    }
    function assertEq15(bytes15 a, bytes15 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes15('A', a);
            log_named_bytes15('B', b);
            fail();
        }
    }
    function assertEq15(bytes15 a, bytes15 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes15('A', a);
            log_named_bytes15('B', b);
            fail();
        }
    }
    function assertEq16(bytes16 a, bytes16 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes16('A', a);
            log_named_bytes16('B', b);
            fail();
        }
    }
    function assertEq16(bytes16 a, bytes16 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes16('A', a);
            log_named_bytes16('B', b);
            fail();
        }
    }
    function assertEq17(bytes17 a, bytes17 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes17('A', a);
            log_named_bytes17('B', b);
            fail();
        }
    }
    function assertEq17(bytes17 a, bytes17 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes17('A', a);
            log_named_bytes17('B', b);
            fail();
        }
    }
    function assertEq18(bytes18 a, bytes18 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes18('A', a);
            log_named_bytes18('B', b);
            fail();
        }
    }
    function assertEq18(bytes18 a, bytes18 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes18('A', a);
            log_named_bytes18('B', b);
            fail();
        }
    }
    function assertEq19(bytes19 a, bytes19 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes19('A', a);
            log_named_bytes19('B', b);
            fail();
        }
    }
    function assertEq19(bytes19 a, bytes19 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes19('A', a);
            log_named_bytes19('B', b);
            fail();
        }
    }
    function assertEq20(bytes20 a, bytes20 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes20('A', a);
            log_named_bytes20('B', b);
            fail();
        }
    }
    function assertEq20(bytes20 a, bytes20 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes20('A', a);
            log_named_bytes20('B', b);
            fail();
        }
    }
    function assertEq21(bytes21 a, bytes21 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes21('A', a);
            log_named_bytes21('B', b);
            fail();
        }
    }
    function assertEq21(bytes21 a, bytes21 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes21('A', a);
            log_named_bytes21('B', b);
            fail();
        }
    }
    function assertEq22(bytes22 a, bytes22 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes22('A', a);
            log_named_bytes22('B', b);
            fail();
        }
    }
    function assertEq22(bytes22 a, bytes22 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes22('A', a);
            log_named_bytes22('B', b);
            fail();
        }
    }
    function assertEq23(bytes23 a, bytes23 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes23('A', a);
            log_named_bytes23('B', b);
            fail();
        }
    }
    function assertEq23(bytes23 a, bytes23 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes23('A', a);
            log_named_bytes23('B', b);
            fail();
        }
    }
    function assertEq24(bytes24 a, bytes24 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes24('A', a);
            log_named_bytes24('B', b);
            fail();
        }
    }
    function assertEq24(bytes24 a, bytes24 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes24('A', a);
            log_named_bytes24('B', b);
            fail();
        }
    }
    function assertEq25(bytes25 a, bytes25 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes25('A', a);
            log_named_bytes25('B', b);
            fail();
        }
    }
    function assertEq25(bytes25 a, bytes25 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes25('A', a);
            log_named_bytes25('B', b);
            fail();
        }
    }
    function assertEq26(bytes26 a, bytes26 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes26('A', a);
            log_named_bytes26('B', b);
            fail();
        }
    }
    function assertEq26(bytes26 a, bytes26 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes26('A', a);
            log_named_bytes26('B', b);
            fail();
        }
    }
    function assertEq27(bytes27 a, bytes27 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes27('A', a);
            log_named_bytes27('B', b);
            fail();
        }
    }
    function assertEq27(bytes27 a, bytes27 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes27('A', a);
            log_named_bytes27('B', b);
            fail();
        }
    }
    function assertEq28(bytes28 a, bytes28 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes28('A', a);
            log_named_bytes28('B', b);
            fail();
        }
    }
    function assertEq28(bytes28 a, bytes28 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes28('A', a);
            log_named_bytes28('B', b);
            fail();
        }
    }
    function assertEq29(bytes29 a, bytes29 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes29('A', a);
            log_named_bytes29('B', b);
            fail();
        }
    }
    function assertEq29(bytes29 a, bytes29 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes29('A', a);
            log_named_bytes29('B', b);
            fail();
        }
    }
    function assertEq30(bytes30 a, bytes30 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes30('A', a);
            log_named_bytes30('B', b);
            fail();
        }
    }
    function assertEq30(bytes30 a, bytes30 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes30('A', a);
            log_named_bytes30('B', b);
            fail();
        }
    }
    function assertEq31(bytes31 a, bytes31 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes31('A', a);
            log_named_bytes31('B', b);
            fail();
        }
    }
    function assertEq31(bytes31 a, bytes31 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes31('A', a);
            log_named_bytes31('B', b);
            fail();
        }
    }
    function assertEq32(bytes32 a, bytes32 b, bytes32 err) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_bytes32(err);
            log_named_bytes32('A', a);
            log_named_bytes32('B', b);
            fail();
        }
    }
    function assertEq32(bytes32 a, bytes32 b) {
        if( a != b ) {
            log_bytes32('Not equal!');
            log_named_bytes32('A', a);
            log_named_bytes32('B', b);
            fail();
        }
    }
    //[[[end]]]

    function assertEq(bytes memory _a, bytes memory _b) {
      if(_a.length != _b.length) {
        log_bytes32('Not equal!');
        log_named_string('A', string(_a));
        log_named_string('B', string(_b));
        fail();
      }
      for(uint8 i=0; i<_a.length; i++) {
        if( _a[i] != _b[i] ) {
          log_bytes32('Not equal!');
          log_named_string('A', string(_a));
          log_named_string('B', string(_b));
          fail();
        }
      }
    }

    function assertEq(string memory a, string memory b) {
      bytes memory _a = bytes(a);
      bytes memory _b = bytes(b);
      assertEq(_a, _b);
    }

}
