from __future__ import print_function
from fnmatch import fnmatch
import cogapp, hashlib, json, os, re, shutil, subprocess, sys, tempfile
import ruamel.yaml as yaml
import dapple.plugins
from . import install

from ethertdd import set_gas_limit, EvmContract
from dapple.cli import cli, click
from dapple.utils import DappleException, expand_dot_keys, deep_merge

from ethereum import slogging
from logging import StreamHandler
dapple_log = slogging.get_logger('dapple')
slogging.get_logger().addHandler(StreamHandler())

def package_dir(package_path):
    if package_path == '':
        return os.getcwd() 

    path = [os.getcwd()]
    for p in package_path.split('.'):
        path.extend(['dapple', 'packages', p])

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
            dapple_log.info('    LOG: %s' % event['val'])

        self.string_args.append(event['val'])

        if len(self.string_args) == self.cached_string.count('%s'):
            print('    LOG: ' + (self.cached_string % tuple(self.string_args)))
            self.cached_string = ''


@dapple.plugins.register('core.contexts')
def apply_context(dappfile, context=None, package_path=''):
    """
    Loads up the global dappfile for the project, with all
    dependency dappfiles filled in, and applies the overrides
    defined in the `contexts` mapping.

    """
    if not context or context not in dappfile.get('contexts', {}):
        return dappfile

    stack = [(dappfile, dappfile['contexts'][context], [])]

    while len(stack) > 0:
        _dappfile, _context, _path = stack.pop()

        for key, val in _context.iteritems():
            if type(val) == dict:
                _path.append(key)

                if key not in _dappfile.get('dependencies', {}):
                    raise DappleException("Invalid context path: '%s'"
                            % '.'.join(_path.join))

                stack.append((_dappfile['dependencies'][key], val, _path))

                continue

            if 'constants' not in _dappfile:
                _dappfile['constants'] = {}

            _dappfile['constants'][key] = val

    return dappfile


@dapple.plugins.register('core.package_dappfile')
def load_package_dappfile(package_path):
    """
    Returns the dappfile of the specified package.

    """
    path = os.path.join(package_dir(package_path), 'dapple', 'dappfile')

    if not os.path.exists(path):
        raise DappleException("%s not found!" % path)

    with open(path, 'r') as f:
        return yaml.load(f.read(), Loader=yaml.RoundTripLoader)


@dapple.plugins.register('core.dappfile')
def load_dappfile(package_path='', env='default'):
    """
    Loads the dappfiles of all dependencies in
    the `dappfile` dictionary.

    """
    # TODO: Respect version numbers. Depends on actually having
    # some kind of package server. Without that, version numbers
    # are basically meaningless.
    # TODO: Respect paths and URLs passed in as version numbers.

    _load_dappfile = dapple.plugins.load('core.dappfile')
    package_dappfile = dapple.plugins.load('core.package_dappfile')
    dappfile = expand_dot_keys(package_dappfile(package_path))

    for key, val in dappfile.get('dependencies', {}).iteritems():
        _package_path = (package_path + '.' + key) if package_path else key
        dappfile['dependencies'][key] = _load_dappfile(
                package_path=_package_path)
    
    if env is None:
        return dappfile

    return apply_context(dappfile, package_path=package_path, context=env)


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

def ignore_globs(globs, pwd=''):
    def _(path, filenames):
        return set([f
            for f in filenames for g in globs
            if fnmatch(os.path.join(path, f), os.path.join(pwd, g))
            or fnmatch(os.path.join(path, f), g)
            or fnmatch(f, g)
        ])
    return _

constant_regex = re.compile('CONSTANT\s*\(\s*["\']?([^\)"\']*)["\']?\s*\)')


@dapple.plugins.register('core.constant_value')
def get_constant_value(constant_name, dappfile):
    """
    Returns a constant's value given a constant's "path"
    and a fully-expanded dappfile dictionary.

    >>> dappfile = {'dependencies': {'core': {'const': '0x0'}}}
    >>> get_constant_value('core.const', dappfile)
    '0x0'

    """
    name_list = constant_name.split('.')

    for i in range(0, len(name_list)-1):
        constant_name = '.'.join(name_list[i+1:])
        dappfile = dappfile.get('dependencies', {}).get(name_list[i], {})
        constant_val = dappfile.get('constants', {}).get(constant_name)

        if constant_val is not None:
            return constant_val

    return dappfile.get('constants', {}).get(constant_name)


@dapple.plugins.register('core.undefined_constant_hashes')
def undefined_constant_hashes(file_contents, dappfile, prefix=''):
    constant_hashes = {}
    matches = constant_regex.findall(file_contents)
    constant_value = dapple.plugins.load('core.constant_value')

    if not matches:
        return constant_hashes

    for constant_name in matches:
        if constant_value(constant_name, dappfile) is None:
            constant_hash = sha256('CONSTANT(%s.%s)'
                    % (prefix, constant_name))[:40] # addresses are 20 bytes
            constant_hashes[constant_name] = '0x' + constant_hash

    return constant_hashes


@dapple.plugins.register('core.insert_constants')
def insert_constants(file_contents, placeholders, dappfile):
    constant_hashes = {}
    matches = constant_regex.findall(file_contents)

    if not matches:
        return file_contents

    for constant_name in matches:
        constant_value = dapple.plugins.load('core.constant_value')
        const_val = constant_value(constant_name, dappfile) \
                or placeholders.get(constant_name) 
        file_contents = re.sub('CONSTANT\s*\(\s*["\']?' + constant_name + '["\']?\s*\)',
            str(const_val), file_contents)

    return file_contents


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
    undefined_constants = {}

    if tmpdir is None:
        tmpdir = dapple.plugins.load('core.build_dir')()

    for key, val in dappfile.get('dependencies', {}).iteritems():
        _path = path + '.' + key if path else key
        _files, _package_hashes, _contracts, _undefined_constants = \
                link_packages(val, path=_path, tmpdir=tmpdir)
        files.update(_files)
        package_hashes.update(_package_hashes)
        contracts.update(_contracts)
        undefined_constants.update(_undefined_constants)

    pkg_hash = sha256(path)
    source_dir = os.path.join(package_dir(path), dappfile.get('source_dir', ''))
    dest_dir = os.path.join(tmpdir, pkg_hash)

    shutil.copytree(
            source_dir, dest_dir,
            ignore=ignore_globs(
                ['dapple'] + dappfile.get('ignore', []), pwd=source_dir))

    package_hashes[path.split('.')[-1]] = pkg_hash

    dir_stack = [dest_dir]

    file_paths = []

    preprocess = dapple.plugins.load("core.preprocess")
    undefined_constant_hashes = dapple.plugins.load(
            "core.undefined_constant_hashes")
    insert_constants = dapple.plugins.load("core.insert_constants")

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

            _undefined_constants = undefined_constant_hashes(
                    files[curpath], dappfile, prefix=path)
            files[curpath] = insert_constants(
                    files[curpath], _undefined_constants, dappfile)
            undefined_constants.update(dict([
                ('%s.%s' % (path, k) if path else k, v)
                for k, v in _undefined_constants.iteritems()]))

            for contract_name in re.findall('^\s*contract ([\w]*)\s*{',
                                            files[curpath], flags=re.MULTILINE):
                contract_loc = '%s:%s' % (curpath, contract_name)
                contracts[contract_name] = {
                    'location': contract_loc,
                    'hash': 'x' + sha256(contract_loc)
                }

    def _path_sub (m):
        old_path = m.group(4)

        if not old_path:
            return old_path

        path_parts = re.split('[/|\\\]', old_path)

        if path_parts[0] == '.' and len(path_parts) > 1:
            new_path = os.path.join(pkg_hash, *path_parts[1:])

        elif path_parts[0] in package_hashes.keys():
            new_path = os.path.join(
                    package_hashes[path_parts[0]], *path_parts[1:])

        else:
            new_path = os.path.join(pkg_hash, *path_parts)

        return m.group(1) + m.group(2) + m.group(3) + new_path
    
    for curpath in file_paths:
        files[curpath] = re.sub(
                '([\\s|;]*)(import\\s*)(["|\'])([^"\']*)',
                _path_sub, files[curpath])

        for name, contract in sorted(
                contracts.items(), key=lambda i: len(i[0])*-1):
            files[curpath] = re.sub('(\s*)(%s)(\s*)' % name,
                                    '\g<1>%s\g<3>' % contract['hash'],
                                    files[curpath])

        with open(curpath, 'w') as f:
            f.write(files[curpath])

    return (files, package_hashes, contracts, undefined_constants)


@cli.command(name="build")
@click.argument("env", default="default")
def cli_build(env):
    print(json.dumps(dapple.plugins.load('core.build')(env)))


@dapple.plugins.register('core.err_hint')
def err_hint(err_msg):
    if 'Parser error: Source not found.' in err_msg:
        return ('Make sure your `dependencies` and `source_dir` '
                'settings in `dapple/dappfile` are correct.')
    return None


@dapple.plugins.register('core.build')
def build(env):
    """
    Gathers together all the contracts and
    the contracts they depend on, then passes
    them to solc and returns a dictionary
    containing the combined build output.

    """
    tmpdir = dapple.plugins.load('core.build_dir')()
    solc_err = None
    files, package_hashes, contracts, undefined_constants = \
            link_packages(load_dappfile(env=env), tmpdir=tmpdir)

    filenames = [f.replace(tmpdir, '', 1)[1:]
            for f in files.keys() if f[-4:] == '.sol']

    if not filenames:
        return {}

    try:
        cmd = ['solc']
        cmd.extend(['--combined-json', 'abi,bin,interface', '--optimize'])
        cmd.extend(filenames)
        p = subprocess.check_output(cmd, cwd=tmpdir,
                stderr=subprocess.STDOUT)

    except subprocess.CalledProcessError as e:
        solc_err = e

    shutil.rmtree(tmpdir)

    if solc_err is not None:
        for name, identifier in package_hashes.iteritems():
            solc_err.output = re.sub(
                    identifier + '[/|\\\]?', name, solc_err.output)
        for name, contract in contracts.iteritems():
            solc_err.output = solc_err.output.replace(contract['hash'], name)
        solc_err.output = re.sub('-+\^', '', solc_err.output)
        print(solc_err.output, file=sys.stderr)

        hint = dapple.plugins.load('core.err_hint')(solc_err.output)
        if hint is not None:
            print('Hint: ' + hint, file=sys.stderr)

        exit(1)

    build = {}
    raw_build = json.loads(p)["contracts"]

    contract_names = dict([(val['hash'], key)
            for key, val in contracts.iteritems()])

    for key, val in raw_build.iteritems():
        contract_name = contract_names.get(key, key)
        if 'interface' in val:
            val['interface'] = val['interface'].replace(key, contract_name)

        if 'bin' in val:
            for const, const_hash in undefined_constants.iteritems():
                val['bin'] = val['bin'].replace(
                        re.sub('^0x', '', const_hash),
                        '__CONSTANT(%s)__' % const)

        build[contract_name] = val

    return build


@cli.command()
@click.argument('env', default='default')
@click.option('-r', '--regex', default="")
@click.option('-e', '--endowment', type=click.INT, default=1000000)
@click.option('-l', '--log_config', multiple=False, type=str, default=":info",
              help='log_config string: e.g. ":info,eth:debug', show_default=True)
@click.option('--log-json/--log-no-json', default=False,
              help='log as structured json output')
def test(env, regex, endowment, log_config, log_json):
    slogging.configure(log_config, log_json=log_json)

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

