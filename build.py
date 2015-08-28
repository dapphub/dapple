import yaml
import subprocess
import json
import os
import datetime

class AppBuilder():
    def __init__(self, buildobj):
        self.buildobj = buildobj
        self.modules = {}

    def build(self):
        for name, module_descriptor in self.buildobj.iteritems():
            self.load_module(name, module_descriptor)
        #print self.modules

    def load_module(self, name, descriptor):
        alias_dir = "/tmp/dapple-build/"
        alias_dir += str(datetime.datetime.utcnow())
        real_dir = os.getcwd() + "/" + descriptor["src"] + "/"
        full_module = {
            "name": name,
            "src_dir": real_dir,
            "alias_dir": alias_dir,
            "alias": descriptor["alias"],
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
                        "aliased_src": aliased_prefix + partial_path + path_segment
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
        print full_module

    def test(self, regex):
        pass


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
    cmd = ['solc']
    cmd.extend(['--combined-json', 'json-abi,binary,sol-abi'])
    cmd.extend(source_paths)
    #print cmd
    p = subprocess.check_output(cmd, cwd=cwd)
    #print p
    pack = json.loads(p)["contracts"]
    return pack


def write_binaries(path, pack, names):
    bins = []
    with open(path, "w") as f:
        for name in names:
            contract = pack[name]
            contract["typename"] = name
            bins.append(contract)
        f.write(json.dumps(bins, indent=4));


