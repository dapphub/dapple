import yaml
import subprocess
import json

# Module name to list of paths
modules = {}
bins = []

def get_paths(path, srcs=None):
    if not path.endswith("/"):
        path += "/"
    if srcs == None:
        build = yaml.load(open(path + "/module.yaml"))
        if "bins" in build.keys():
            for k, v in build["bins"].iteritems():
                bins.append(k)
        srcs = build["srcs"]
    paths = []
    for k, v in srcs.iteritems():
        if v == True:
            paths.append(path + k)
        elif v != False: # not a bool
            subpaths = get_paths(path + k + "/", v)
            paths.extend(subpaths)
    return paths

# Tries to compile all sources
# Returns an EVM library ("pack").
def compile_sources(paths, cwd):
    cmd = ['solc']
    cmd.extend(['--combined-json', 'json-abi,binary,sol-abi'])
    cmd.extend(paths)
    #print cmd
    p = subprocess.check_output(cmd, cwd=cwd)
    #print p
    pack = json.loads(p)["contracts"]
    return pack



def load_module(module_name, app_yaml):
    module = app_yaml[module_name]
    if "deps" in module.keys():
        for dep in module["deps"]:
            if dep not in modules.keys():
                load_module(dep, app_yaml)
    paths = get_paths(module["src"])
    modules[module_name] = paths

def write_binaries(path, pack, names):
    bins = []
    with open(path, "w") as f:
        for name in names:
            contract = pack[name]
            contract["typename"] = name
            bins.append(contract)
        f.write(json.dumps(bins, indent=4));
