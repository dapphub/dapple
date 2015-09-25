from dapple import cli, click

@cli.command()
@click.option('-s', '--string', default="")
def new(string=""):
    print "Making new"
