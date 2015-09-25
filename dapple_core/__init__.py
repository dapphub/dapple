from dapple import cli, click

@cli.command()
def new(string=""):
    print "TBD"

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

