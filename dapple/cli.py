from __future__ import print_function
from pkg_resources import cleanup_resources, resource_filename, resource_string

import click
import dapple.plugins
import importlib
import os
import shutil
import sys
import yaml


def load_prefs():
    prefs_file = os.path.join(os.path.expanduser('~'), '.dapplerc')

    if not os.path.exists(prefs_file):
        shutil.copy(resource_filename(__name__, 'defaults/_dapplerc'),
                prefs_file)

        cleanup_resources()

    with open(prefs_file, 'r') as f:
        return yaml.load(f)


def load_plugins():
    with open('.dapple/plugins', 'r') as f:
        plugins = f.readlines()

    for plugin in plugins:
        importlib.import_module(plugin)


@click.command()
def init():
    shutil.copytree(resource_filename(__name__, 'defaults/_dapple'), '.dapple')

    # resource_filename leaves behind temp files.
    # cleanup_resources deletes them.
    cleanup_resources()

    try:
        load_plugins()
        (dapple.plugins.load('ipfs.install_package'))(
                'core', ipfs='QmdVwtRTUinSU5EHPS84iYz5cLHA1BbZM6Gw6RvhnCHnRP') 

    except:
        print("ERROR: Could not pull `core` package from IPFS! "
                "You might try installing it manually.", file=sys.stderr)


    print("Init'ed Dapple package. You might want to edit .dapple/dappfile now.")


class InitialCLI(click.MultiCommand):
    def list_commands(self, ctx):
        return 'init'

    def get_command(self, ctx, name):
        if name == "init":
            return init

        print('This does not appear to be a Dapple package.'
              ' Run `dapple init` first.', file=sys.stderr)
        sys.exit(1)


@click.group()
def cli():
    pass
