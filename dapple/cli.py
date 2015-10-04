from __future__ import print_function
from pkg_resources import resource_listdir, resource_string

import click
import os
import sys


@click.command()
def init():
    os.makedirs('.dapple')

    for fname in resource_listdir(__name__, 'defaults'):
        with open('.dapple/' + fname, 'w') as f:
            f.write(resource_string(__name__, 'defaults/' + fname))

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
