// The linker should link this to the copy of contract.sol in dapple_packages.
import '<%= contract_hash %>';

// The linker should link this to the local copy of contract.sol.
import '<%= local_contract_hash %>';

contract LinkerExample {
    PkgContract pkgContract;
    DapplePkgContract dapplePkgContract;
    mapping(string=>address) contracts;

    function LinkerExample() {
        pkgContract = new PkgContract();
        dapplePkgContract = new DapplePkgContract();
        contracts["foo"] = "0xf00";
    }
}

contract ParenExample() {}
