from ethertdd import EvmContract
import json
import yaml
import sys
import re

abi, binary = None, None
suite = {}
def run_tests(pack, testregex=None):
    for typename, info in pack.iteritems():
        if testregex is not None:
            if not re.match(".*"+testregex+".*", typename, flags=re.IGNORECASE):
                continue
        if typename == "Test": # base test matches too often
            continue
        
        if info["binary"] == "": # Abstract classes
            continue
        abi = info["json-abi"]
        jabi = json.loads(abi)
        is_test = False
        for item in jabi:
            if "name" in item.keys() and item["name"] == "IS_TEST":
                is_test = True
        if not is_test:
            continue

        print "Testing", typename
        binary = info["binary"].decode('hex')
        try:
            tmp = EvmContract(abi, binary, typename, [], gas=10**9) 
        except Exception, e:
        #    print typename, info
            raise e
        for func in dir(tmp):
            if func.startswith("test"):
                print "  " + func
                contract = EvmContract(abi, binary, typename, [], gas=10**9) 
                if hasattr(contract, "setUp"):
                    contract.setUp()
                getattr(contract, func)()
                if contract.failed():
                    print "    Fail!"


