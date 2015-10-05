from .cli import cli, InitialCLI, load_plugins

if "__main__" in __name__:
    try:
        load_plugins()

    except IOError as e:
        plugins = []
        cli = InitialCLI()

    cli()
