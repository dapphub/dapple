build/module improvements

build object tree should end in contract file set descriptor:

    mydapp:
        math:


should generate boilerplate:

    math.soli

        contract MathInterface {
        }
 
    math.sol:

        import 'mydapp/math.soli';
        contract Math is MathInterface {
            function Math() {
            }
        }


    math.solt:

        import 'dappsys/test/test.sol';
        import 'mydapp/math.sol';
        contract MathTest is Test {
            Math m;
            function SetUp() {
                m = new Math();
            }
            function testExampleThing() {
                // tests start with "test" and
                // can call "fail()"
            }
        }
