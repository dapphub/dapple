import os
import importlib
import dapple
import yaml
import sys
import subprocess
import click
from . import cli

if __name__ == "__main__":
    try:
        with open('.dapple/plugins', 'r') as f:
            plugins = f.readlines()

    except IOError:
        plugins = ['dapple_core']
        os.makedirs('.dapple')
        with open('.dapple/plugins', 'w') as f:
            f.write('dapple_core')

    for plugin in plugins:
        importlib.import_module(plugin)

    cli()
