from __future__ import print_function
import os
import importlib
import dapple
import yaml
import sys
import subprocess
import click
from .cli import cli

def init(string=""):
    plugins = ['dapple_core']
    os.makedirs('.dapple')

    with open('.dapple/plugins', 'w') as f:
        f.write('dapple_core')

    with open('.dapple/dappfile', 'w') as f:
        f.write("name: 'my_dapple_package'\nversion: '0.0.1a'")

    with open('.dapple/.gitignore', 'w') as f:
        f.write("packages")

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
