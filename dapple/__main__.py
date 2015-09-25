import os
import importlib
import dapple
import yaml
import sys
import subprocess
import click
from . import cli

def load_dapp(buildpath="dapplefile"):
    with open(buildpath) as buildfile:
        buildobj = yaml.load(buildfile)
        dapp = dapple.Dapp(buildobj)
        return dapp

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
