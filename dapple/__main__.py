import importlib
from .cli import cli, InitialCLI

if "__main__" in __name__:
    try:
        with open('.dapple/plugins', 'r') as f:
            plugins = f.readlines()

        for plugin in plugins:
            importlib.import_module(plugin)

    except:
        plugins = []
        cli = InitialCLI()

    cli()
