contract Example {
    uint public arg;
    function Example( uint _arg ) {
        arg = _arg;
    }
    function exampleFunction(uint arg2) returns (uint, uint) {
        return (arg, arg2);
    }
}
