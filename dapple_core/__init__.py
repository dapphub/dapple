from __future__ import print_function
import cogapp, hashlib, json, os, re, shutil, subprocess, sys, tempfile, yaml
import dapple.plugins

from ethertdd import set_gas_limit, EvmContract
from dapple import cli, click, DappleException, expand_dot_keys, deep_merge

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


class LogEventLogger(object):
    def __init__(self):
        self.cached_string = ''
        self.string_args = []

    def __call__(self, event):
        if event is None:
            return

        if event['_event_type'] == '_log_gas_use':
            print('    Used %s gas' % event['gas'])
            return

        try:
            if '%s' in event['val']:
                self.cached_string = event['val']
                return
        except TypeError:
            pass

        if not self.cached_string:
            print('    LOG: %s' % event['val'])

        self.string_args.append(event['val'])

        if len(self.string_args) == self.cached_string.count('%s'):
            print('    LOG: ' + (self.cached_string % tuple(self.string_args)))
            self.cached_string = ''


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

        _package_path = (package_path + '.' + key) if package_path else key
        dappfile[key] = load_dappfile(
                dappfile=dappfile['dependencies'][key],
                package_path=_package_path)

    return dappfile


@dapple.plugins.register('core.preprocess')
def preprocess(file_contents, dappfile):
    cog = cogapp.Cog()
    cog.options.defines = dappfile.get('preprocessor_vars', {})

    try:
        return cog.processString(file_contents)

    except cogapp.cogapp.CogError:
        print(file_contents, file=sys.stderr)
        raise


@dapple.plugins.register('core.build_dir')
def build_dir():
    return tempfile.mkdtemp(prefix='dapple-')

@dapple.plugins.register('core.link_packages')
def link_packages(dappfile, path='', tmpdir=None):
    """
    Pulls contract file contents into a dictionary
    based on their position within the dappfile.
    Returns a tuple consisting of the tree of source
    file contents, a dictionary of package paths
    to hashes, and a dictionary of contract paths
    to hashes.

    """
    # TODO: Break this function up into smaller pieces.
    files = {}
    package_hashes = {}
    contracts = {}

    if tmpdir is None:
        tmpdir = dapple.plugins.load('core.build_dir')()

    for key, val in dappfile.get('dependencies', {}).iteritems():
        _path = path + '.' + key if path else key
        _files, _package_hashes, _contracts = link_packages(val, path=_path, tmpdir=tmpdir)
        package_hashes.update(_package_hashes)
        contracts.update(_contracts)
        files.update(_files)

    pkg_hash = sha256(path)
    source_dir = os.path.join(package_dir(path), dappfile.get('source_dir', ''))
    dest_dir = os.path.join(tmpdir, pkg_hash)

    ignore_globs = ['.dapple'] + dappfile.get('ignore', [])
    shutil.copytree(source_dir, dest_dir,
                    ignore=shutil.ignore_patterns(*ignore_globs))

    package_hashes[path.split('.')[-1]] = pkg_hash

    dir_stack = [dest_dir]

    file_paths = []

    preprocess = dapple.plugins.load("core.preprocess")

    def local_path_sub (m):
        newpath = ''

        if m.group(4):
            newpath = os.path.join(pkg_hash, m.group(4))

        return ''.join([m.group(i) for i in range(1, 4)]) + newpath

    while len(dir_stack) > 0:
        curdir = dir_stack.pop()

        for filename in os.listdir(curdir):
            curpath = os.path.join(curdir, filename)

            if os.path.isdir(curpath):
                dir_stack.append(curpath)
                continue

            if filename[-4:] != '.sol':
                continue

            file_paths.append(curpath)

            with open(curpath, 'r') as f:
                try:
                    files[curpath] = preprocess(f.read(), dappfile)
                except:
                    print("Error preprocessing %s" % curpath, file=sys.stderr)
                    raise

            for contract_name in re.findall('^\s*contract ([\w]*)\s*{',
                                            files[curpath], flags=re.MULTILINE):
                contract_loc = '%s:%s' % (curpath, contract_name)
                contracts[contract_name] = {
                    'location': contract_loc,
                    'hash': 'x' + sha256(contract_loc)
                }
    
    for curpath in file_paths:
        files[curpath] = re.sub(
            '([\\s|;]*)(import\\s*)(["|\']?)(?!dapple)([^"\';]*)',
            local_path_sub, files[curpath])

        for name, hash in package_hashes.iteritems():
            files[curpath] = re.sub(
                '([\s|;]*)(import\s*)(["|\']?)(dapple[/|\\\]%s)([/|\\\])'
                % name, '\g<1>\g<2>\g<3>%s\g<5>' % hash, files[curpath])

        for name, contract in sorted(
                contracts.items(), key=lambda i: len(i[0])*-1):
            files[curpath] = re.sub('(\s*)(%s)(\s*)' % name,
                                    '\g<1>%s\g<3>' % contract['hash'],
                                    files[curpath])

        with open(curpath, 'w') as f:
            f.write(files[curpath])

    return (files, package_hashes, contracts)


@cli.command(name="build")
@click.argument("env", default="dev")
def cli_build(env):
    print(dapple.plugins.load('core.build')(env))


@dapple.plugins.register('core.build')
def build(env):
    """
    Gathers together all the contracts and
    the contracts they depend on, then passes
    them to solc and returns a dictionary
    containing the combined build output.

    """
    tmpdir = dapple.plugins.load('core.build_dir')()
    err = None
    try:
        files, package_hashes, contracts = link_packages(
                        load_dappfile(env=env), tmpdir=tmpdir)

        filenames = [f.replace(tmpdir, '', 1)[1:] for f in files.keys() if f[-4:] == '.sol']

        try:
            cmd = ['solc']
            cmd.extend(['--combined-json', 'json-abi,binary,sol-abi'])
            cmd.extend(filenames)
            p = subprocess.check_output(cmd, cwd=tmpdir)

        except subprocess.CalledProcessError as e:
            cmd = ['solc']
            cmd.extend(['--combined-json', 'abi,bin,interface'])
            cmd.extend(filenames)
            p = subprocess.check_output(cmd, cwd=tmpdir)

    except Exception as e:
        err = e

    shutil.rmtree(tmpdir)

    if err is not None:
        raise err

    build = {}
    raw_build = json.loads(p)["contracts"]

    contract_names = dict([(val['hash'], key)
            for key, val in contracts.iteritems()])

    for key, val in raw_build.iteritems():
        contract_name = contract_names.get(key, key)
        if 'interface' in val:
            val['interface'] = val['interface'].replace(key, contract_name)

        build[contract_name] = val

    shutil.rmtree(tmpdir)

    return build


@cli.command()
@click.argument('env', default='dev')
@click.option('-r', '--regex', default="")
@click.option('-e', '--endowment', type=click.INT, default=1000000)
def test(env, regex, endowment):
    build = dapple.plugins.load('core.build')(env)

    abi, binary = None, None
    suite = {}

    for typename, info in build.iteritems():
        binary = ""
        if "binary" in info.keys():
            binary = info["binary"]
        else:
            binary = info["bin"]
        if regex is not None:
            if not re.match(".*"+regex+".*", typename, flags=re.IGNORECASE):
                continue
        if typename == "Test": # base test matches too often
            continue

        if binary == "": # Abstract classes
            continue
        abi = ""
        if "json-abi" in info.keys():
            abi = info["json-abi"]
        else:
            abi = info["abi"]
        jabi = json.loads(abi)
        is_test = False
        for item in jabi:
            if "name" in item.keys() and item["name"] == "IS_TEST":
                is_test = True
        if not is_test:
            continue

        print("Testing", typename)
        binary = binary.decode('hex')
        tmp = None
        try:
            tmp = EvmContract(abi, binary, typename, [], gas=10**9)
        except Exception, e:
            raise e

        for func in dir(tmp):
            if func.startswith("test"):
                print("  " + func)
                contract = EvmContract(
                    abi, binary, typename, [], gas=10**9,
                    endowment=endowment, log_listener=LogEventLogger())
                if hasattr(contract, "setUp"):
                    contract.setUp()
                getattr(contract, func)()
                if contract.failed():
                    print("    Fail!")


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

