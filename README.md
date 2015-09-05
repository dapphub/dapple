
dapple test

dapple stage
    writes a contract package to workspace

dapple deploy <typename>
    deplies a contract type from the staging area
    if contract is static and none exists for this chain, writes to module .yaml


dapple install
    pulls module, adds to build.yaml





-----------


dapple workspace ("~/.dapple")
    chains [
        datadir (possibly symlink)
        chain_id
        [ static_contract ]
   ]




chain_context:
    chain_id
    rpc info

contract_type:
    .sol source
    binary
    typename
    abi

contract_instance:
    contract_type
    chain_id

static_contract:
    contract_type
    chain_id -> address


contract package:
    [ contract_type ]
    [ static_contract ]




------------------

load build.yaml
assemble modules
    create module oject:
        name
        real source directory
        alias (how do you import it in solidity?)

preprocess:
    cog
    gcc

processed_sources
binary, abi = compile( processed_sources )

