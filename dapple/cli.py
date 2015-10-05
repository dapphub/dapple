from __future__ import print_function
from pkg_resources import resource_listdir, resource_string

import click
import dapple.plugins
import importlib
import os
import sys


def load_plugins():
    with open('.dapple/plugins', 'r') as f:
        plugins = f.readlines()

    for plugin in plugins:
        importlib.import_module(plugin)


@click.command()
def init():
    os.makedirs('.dapple')

    for fname in resource_listdir(__name__, 'defaults'):
        with open('.dapple/' + fname, 'w') as f:
            f.write(resource_string(__name__, 'defaults/' + fname))

    try:
        load_plugins()
        (dapple.plugins.load('ipfs.install_package'))(
                'core', ipfs='QmabKxK119XaoLw21wkyxcRkcuxNevZc9nFcUppdoG1AoH') 

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
