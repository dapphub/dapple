import yaml
import subprocess
import json
import test

# Module name to list of paths
modules = {}

def get_paths(path, build=None):
    if not path.endswith("/"):
        path += "/"
    if build == None:
        build = yaml.load(open(path + "/module.yaml"))
    paths = []
    for k, v in build.iteritems():
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
    if "keps" in module.keys():
        for dep in module["deps"]:
            if dep not in modules.keys():
                load_module(dep, app_yaml)
    paths = get_paths(module["src"])
    modules[module_name] = paths


buildpath = "build.yaml"
with open(buildpath) as buildfile:
    build = yaml.load(buildfile)
    for name, _ in build.iteritems():
        load_module(name, build)
    paths = []
    for name, module_paths in modules.iteritems():
        paths.extend(module_paths)
    #TODO these need to be copied from their sources
    # to a temp directory with packages moved to their
    # correct locations. Right now this works because
    # the true source path matches the import path.
    pack = compile_sources(paths, ".")
    test.run_tests(pack)
