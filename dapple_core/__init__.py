import cogapp, hashlib, json, os, re, shutil, subprocess, tempfile, yaml
import dapple.plugins

from dapple import cli, click, expand_dot_keys, deep_merge

def load_dapp(buildpath="dappfile"):
    with open(buildpath) as buildfile:
        buildobj = yaml.load(buildfile)
        dapp = dapple.Dapp(buildobj)
        return dapp


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


def package_dir(package_path):
    if package_path == '':
        return os.getcwd() 

    path = [os.getcwd()]
    for p in package_path.split('.'):
        path.extend(['.dapple', 'packages', p])

    return os.path.join(*path)


def sha256(data):
    sha = hashlib.sha256()
    sha.update(data)
    return sha.hexdigest()


@dapple.plugins.register('core.environments')
def apply_environment(dappfile, env=None, package_path=''):
    """
    Loads up the global dappfile for the project, with all
    dependency dappfiles filled in, and applies the overrides
    defined in the `environments` mapping.

    """
    package_dappfile = dapple.plugins.load('core.package_dappfile')

    if not env or env not in dappfile.get('environments', {}):
        return dappfile

    environment = dappfile['environments'][env]
    if not isinstance(environment, dict):
        environment = package_dappfile(
                package_path, env=env, filename=environment)

    return deep_merge(dappfile, environment)


@dapple.plugins.register('core.package_dappfile')
def load_package_dappfile(package_path, env=None, filename='dappfile'):
    """
    Returns the dappfile of the specified package.

    """
    apply_environment = dapple.plugins.load('core.environments')
    path = os.path.join(package_dir(package_path), '.dapple', filename)

    if not os.path.exists(path):
        raise DappleException("%s not found!" % path)

    with open(path, 'r') as f:
        return apply_environment(
                expand_dot_keys(yaml.load(f)),
                package_path=package_path, env=env)


@dapple.plugins.register('core.dappfile')
def load_dappfile(dappfile={}, package_path='', env=None):
    """
    Loads the dappfiles of all dependencies in
    the `dappfile` dictionary.

    """
    # TODO: Respect version numbers. Depends on actually having
    # some kind of package server. Without that, version numbers
    # are basically meaningless.
    # TODO: Respect paths and URLs passed in as version numbers.

    package_dappfile = dapple.plugins.load('core.package_dappfile')
    dappfile = deep_merge(package_dappfile(package_path, env=env), dappfile)

    for key, val in dappfile.get('dependencies', {}).iteritems():
        if not isinstance(val, dict):
            dappfile['dependencies'][key] = {}

        package_path += ('.' + key) if package_path else key
        dappfile[key] = load_dappfile(
                dappfile=dappfile['dependencies'][key],
                package_path=package_path)

    return dappfile


@dapple.plugins.register('core.load_files')
def load_contract_files(dappfile, path=''):
    """
    Pulls contract file contents into a dictionary
    based on their position within the dappfile.
    Returns a tuple consisting of the tree of source
    file contents and a dictionary of contract hashes
    to their path names.

    """
    files = {}
    names = {}

    for key, val in dappfile.get('dependencies', {}).iteritems():
        _path = path + '.' + key if path else key
        _files, _names = load_contract_files(val, _path)
        names.update(_names)
        files[key] = _files

    

    return (files, names)


def compile_sources(env=None):
    """
    Gathers together all the contracts and
    the contracts they depend on, then passes
    them to solc and returns a dictionary
    containing the combined build output.

    """
    print "TBD"


@cli.command()
def new(string=""):
    print "TBD"

@cli.command()
@click.option('-r', '--regex', default="")
def test(regex):
    dapp = load_dapp()
    dapp.build()
    dapp.test(regex)

@cli.command()
@click.option('--stagedir', default="dapple/staging")
def stage(stagedir):
    dapp = load_dapp()
    dapp.build()
    dapp.write_binaries(stagedir)

@cli.command()
@click.argument("env")
def chain(env):
    if env == "testnet":
        subprocess.call("geth --datadir devdatadir --networkid 42 --unlock 0 --password devdatadir/pass.txt --mine console", shell=True)
    else:
        click.echo("Unknown chain environment")

