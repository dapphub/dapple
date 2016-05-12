contract Debug {
    event logs(bytes val);

    // Generate log_* and log_named* functions
    /*[[[cog
    import cog
    types = ['bool', 'uint', 'int', 'address', 'bytes']
    for i in range(32):
        types.append('bytes'+str(i+1))

    for type in types:
        cog.outl("event log_" + type + "(" + type + " val);")
        cog.outl("event log_named_" + type + "(bytes32 key, " + type + " val);")
    ]]]*/
    event log_bool(bool val);
    event log_named_bool(bytes32 key, bool val);
    event log_uint(uint val);
    event log_named_uint(bytes32 key, uint val);
    event log_int(int val);
    event log_named_int(bytes32 key, int val);
    event log_address(address val);
    event log_named_address(bytes32 key, address val);
    event log_bytes(bytes val);
    event log_named_bytes(bytes32 key, bytes val);
    event log_bytes1(bytes1 val);
    event log_named_bytes1(bytes32 key, bytes1 val);
    event log_bytes2(bytes2 val);
    event log_named_bytes2(bytes32 key, bytes2 val);
    event log_bytes3(bytes3 val);
    event log_named_bytes3(bytes32 key, bytes3 val);
    event log_bytes4(bytes4 val);
    event log_named_bytes4(bytes32 key, bytes4 val);
    event log_bytes5(bytes5 val);
    event log_named_bytes5(bytes32 key, bytes5 val);
    event log_bytes6(bytes6 val);
    event log_named_bytes6(bytes32 key, bytes6 val);
    event log_bytes7(bytes7 val);
    event log_named_bytes7(bytes32 key, bytes7 val);
    event log_bytes8(bytes8 val);
    event log_named_bytes8(bytes32 key, bytes8 val);
    event log_bytes9(bytes9 val);
    event log_named_bytes9(bytes32 key, bytes9 val);
    event log_bytes10(bytes10 val);
    event log_named_bytes10(bytes32 key, bytes10 val);
    event log_bytes11(bytes11 val);
    event log_named_bytes11(bytes32 key, bytes11 val);
    event log_bytes12(bytes12 val);
    event log_named_bytes12(bytes32 key, bytes12 val);
    event log_bytes13(bytes13 val);
    event log_named_bytes13(bytes32 key, bytes13 val);
    event log_bytes14(bytes14 val);
    event log_named_bytes14(bytes32 key, bytes14 val);
    event log_bytes15(bytes15 val);
    event log_named_bytes15(bytes32 key, bytes15 val);
    event log_bytes16(bytes16 val);
    event log_named_bytes16(bytes32 key, bytes16 val);
    event log_bytes17(bytes17 val);
    event log_named_bytes17(bytes32 key, bytes17 val);
    event log_bytes18(bytes18 val);
    event log_named_bytes18(bytes32 key, bytes18 val);
    event log_bytes19(bytes19 val);
    event log_named_bytes19(bytes32 key, bytes19 val);
    event log_bytes20(bytes20 val);
    event log_named_bytes20(bytes32 key, bytes20 val);
    event log_bytes21(bytes21 val);
    event log_named_bytes21(bytes32 key, bytes21 val);
    event log_bytes22(bytes22 val);
    event log_named_bytes22(bytes32 key, bytes22 val);
    event log_bytes23(bytes23 val);
    event log_named_bytes23(bytes32 key, bytes23 val);
    event log_bytes24(bytes24 val);
    event log_named_bytes24(bytes32 key, bytes24 val);
    event log_bytes25(bytes25 val);
    event log_named_bytes25(bytes32 key, bytes25 val);
    event log_bytes26(bytes26 val);
    event log_named_bytes26(bytes32 key, bytes26 val);
    event log_bytes27(bytes27 val);
    event log_named_bytes27(bytes32 key, bytes27 val);
    event log_bytes28(bytes28 val);
    event log_named_bytes28(bytes32 key, bytes28 val);
    event log_bytes29(bytes29 val);
    event log_named_bytes29(bytes32 key, bytes29 val);
    event log_bytes30(bytes30 val);
    event log_named_bytes30(bytes32 key, bytes30 val);
    event log_bytes31(bytes31 val);
    event log_named_bytes31(bytes32 key, bytes31 val);
    event log_bytes32(bytes32 val);
    event log_named_bytes32(bytes32 key, bytes32 val);
    event log_named_string(string key, string val);
    //[[[end]]]

    event _log_gas_use(uint gas);

    modifier logs_gas() {
        uint _start_gas = msg.gas;
        _
        _log_gas_use(_start_gas - msg.gas);
    }
}
