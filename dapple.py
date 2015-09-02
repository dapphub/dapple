import yaml
import re
import subprocess
import json
import os
import shutil
import time
import string
from ethertdd import EvmContract

class Dapp():
    def __init__(self, buildobj):
        self.buildobj = buildobj
        self.modules = {}
        self.built_pack = []
        self.build_dir = ""

    def build(self):
        self.build_dir = "/tmp/dapple-build/"
        self.build_dir += string.replace(str(time.time()), ".", "")

        for name, module_descriptor in self.buildobj.iteritems():
            self.load_module(name, module_descriptor)

        build_paths = []
        for name, module in self.modules.iteritems():
            alias_root_dir = module["alias_dir"]
            module_alias_dir = alias_root_dir + "/" + module.get("alias", name)
            if not os.path.exists(module_alias_dir):
                os.makedirs(module_alias_dir)

            for paths in module["sources"]:
                dirname = os.path.dirname(paths["aliased_src"])
                if not os.path.exists(dirname):
                    os.makedirs(dirname)
                
                shutil.copy(paths["real_src"], paths["aliased_src"])
                build_paths.append(paths["solc_src"])

            cogfile_src = module["src_dir"] + "cogfile"
            cogfile_dest = module_alias_dir + "/cogfile"
            if os.path.exists(cogfile_src):
                shutil.copy(cogfile_src, cogfile_dest)
                subprocess.check_output("python -m cogapp -r @cogfile", cwd=module_alias_dir, shell=True)


        self.built_pack = compile_sources(build_paths, self.build_dir)

    def write_binaries(self, path):
        bins = []
        with open(path, "w") as f:
            for name, module in self.modules.iteritems():
                if "bins" in module.keys():
                    for name, ok in module["bins"].iteritems():
                        if ok and name in self.built_pack.keys():
                            contract = self.built_pack[name]
                            contract["typename"] = name
                            bins.append(contract)
            f.write(json.dumps(bins, indent=4));

    def load_module(self, name, descriptor):
        alias_dir = self.build_dir
        real_dir = os.getcwd() + "/" + descriptor["src"] + "/"
        full_module = {
            "name": name,
            "src_dir": real_dir,
            "alias_dir": alias_dir,
            "alias": descriptor.get("alias", name),
            "sources": []
        }

        module_object = yaml.load(open(full_module["src_dir"]+"/module.yaml"))
        def populate_source_paths(source_object, partial_path=""):
            aliased_prefix = alias_dir + "/" + full_module["alias"] + "/"
            real_prefix = real_dir
            for path_segment, sub_source_object in source_object.iteritems():
                if sub_source_object == True:
                    paths = {
                        "real_src": real_prefix + partial_path + path_segment,
                        "aliased_src": aliased_prefix + partial_path + path_segment,
                        "solc_src": full_module["alias"] + "/" + partial_path + path_segment
                    }
                    full_module["sources"].append(paths)
                elif sub_source_object != False: # not a bool
                    populate_source_paths(sub_source_object, partial_path + path_segment + "/" )
                else:
                    print("UKNOWN CASE")
                    sys.exit(1)
        populate_source_paths(module_object["srcs"], "")
        if "bins" in module_object.keys():
            full_module["bins"] = module_object["bins"]

        self.modules[name] = full_module


    def test(self, testregex=None):
        abi, binary = None, None
        suite = {}

        for typename, info in self.built_pack.iteritems():
            binary = info.get("binary", info["bin"])
            if testregex is not None:
                if not re.match(".*"+testregex+".*", typename, flags=re.IGNORECASE):
                    continue
            if typename == "Test": # base test matches too often
                continue
            
            if binary == "": # Abstract classes
                continue
            abi = info.get("json-abi", info["abi"])
            jabi = json.loads(abi)
            is_test = False
            for item in jabi:
                if "name" in item.keys() and item["name"] == "IS_TEST":
                    is_test = True
            if not is_test:
                continue

            print "Testing", typename
            binary = binary.decode('hex')
            tmp = None
            try:
                tmp = EvmContract(abi, binary, typename, [], gas=10**9) 
            except Exception, e:
                print typename, info
                raise e
            for func in dir(tmp):
                if func.startswith("test"):
                    print "  " + func
                    contract = EvmContract(abi, binary, typename, [], gas=10**9, endowment=1000000) 
                    if hasattr(contract, "setUp"):
                        contract.setUp()
                    getattr(contract, func)()
                    if contract.failed():
                        print "    Fail!"



def get_source_paths(descriptor_path, srcs=None):
    for k, v in srcs.iteritems():
        if v == True:
            paths.append(descriptor_path + k)
        elif v != False: # not a bool
            subpaths = get_paths(descriptor_path + k + "/", v)
            paths.extend(subpaths)
    return paths

# Tries to compile all sources
# Returns an EVM library ("pack").
def compile_sources(source_paths, cwd):
    # copy contracts from true source files to temp directory
    # with imported contract names
    try:
        cmd = ['solc']
        cmd.extend(['--combined-json', 'json-abi,binary,sol-abi'])
        cmd.extend(source_paths)
        p = subprocess.check_output(cmd, cwd=cwd)

    except IOError:
        cmd = ['solc']
        cmd.extend(['--combined-json', 'abi,bin,interface'])
        cmd.extend(source_paths)
        p = subprocess.check_output(cmd, cwd=cwd)

    #print p
    pack = json.loads(p)["contracts"]
    return pack



