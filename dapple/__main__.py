from __future__ import print_function
from pkg_resources import resource_listdir, resource_string

import os
import importlib
import dapple
import yaml
import sys
import subprocess
import click
from .cli import cli

def init(string=""):
    os.makedirs('.dapple')

    for fname in resource_listdir(__name__, 'defaults'):
        with open('.dapple/' + fname, 'w') as f:
            f.write(resource_string(__name__, 'defaults/' + fname))

    print("Init'ed Dapple package. You might want to edit .dapple/dappfile now.")

if "__main__" in __name__:
    try:
        with open('.dapple/plugins', 'r') as f:
            plugins = f.readlines()

    except:
        plugins = []
        cli.command()(init)

    for plugin in plugins:
        importlib.import_module(plugin)

    cli()
