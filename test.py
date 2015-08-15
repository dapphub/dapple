from ethertdd import EvmContract
import json
import yaml
import sys

abi, binary = None, None
suite = {}
def run_tests(pack):
    for typename, info in pack.iteritems():
        if typename == "Test":
            continue
        if info["binary"] == "":
            #print "Skipping abstract class", typename
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
            tmp = EvmContract(abi, binary, typename, [], gas=10**10) 
        except Exception, e:
        #    print typename, info
            raise e
        for func in dir(tmp):
            if func.startswith("test"):
                print "  " + func
                contract = EvmContract(abi, binary, typename, [], gas=10**10) 
                if hasattr(contract, "setUp"):
                    contract.setUp()
                getattr(contract, func)()
                if contract.failed():
                    print "    Fail!"


