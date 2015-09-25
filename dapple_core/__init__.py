import os, yaml
from dapple import cli, click, expand_dot_keys, deep_merge
from dapple.plugins import PluginRegistry

plugins = PluginRegistry()

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


def apply_environment(dappfile, env=None, package_path=''):
    """
    Loads up the global dappfile for the project, with all
    dependency dappfiles filled in, and applies the overrides
    defined in the `environments` mapping.

    """
    load_dappfile = plugins.load('core.dappfile')

    if not env or env not in dappfile.get('environments', {}):
        return dappfile

    environment = dappfile['environments'][env]
    if not isinstance(environment, dict):
        environment = load_dappfile(
                package_path, env=env, filename=environment)

    return deep_merge(dappfile, environment)

plugins.register('core.environments')


def load_dappfile(package_path, env=None, filename='dappfile'):
    """
    Returns the dappfile of the specified package.

    """
    apply_environment = plugins.load('core.environments')
    path = os.getcwd() + ('/.dapple'.join([
        '/packages/%s/.dapple' % p for p in package_path.split('.')
    ]) + '/' + filename)

    with open(path, 'r') as f:
        return apply_environment(
                expand_dot_keys(yaml.load(f)),
                package_path=package_path, env=env)

plugins.register('core.dappfile', load_dappfile)


def load_dependencies(dappfile={}, package_path=''):
    """
    Loads the dappfiles of all dependencies in
    the `dappfile` dictionary.

    """
    # TODO: Respect version numbers. Depends on actually having
    # some kind of package server. Without that, version numbers
    # are basically meaningless.
    # TODO: Respect paths and URLs passed in as version numbers.

    load_dappfile = plugins.load('core.dappfile')
    dappfile = deep_merge(load_dappfile(package_path), dappfile)

    for key, val in dappfile.get('dependencies', {}).iteritems():
        if not isinstance(val, dict):
            val = {}
            dappfile[key] = val

        package_path += ('.' + key) if package_path else package_path
        dappfile[key] = load_dependencies(
                dappfile=dappfile[key], package_path=package_path)

    return dappfile

plugins.register('core.dependencies', load_dependencies)


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

