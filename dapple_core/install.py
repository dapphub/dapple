from __future__ import print_function
import ipfsApi
import tarfile
import os

import dapple.plugins
from dapple import cli, click

ipfs = None

@dapple.plugins.register('ipfs.init_client')
def get_ipfs_client(options=None):
    try:
        global ipfs
        ipfs = ipfsApi.Client("127.0.0.1", 5001)
    except:
        print("No ipfs connection")
    return ipfs

@dapple.plugins.register('ipfs.get_dir')
def ipfs_get_dir(nodehash, cwd):
    obj = ipfs.ls(nodehash)["Objects"][0]
    for item in obj["Links"]:
        if item["Type"] == 1:
            subdir = cwd + "/" + item["Name"]
            os.mkdir(subdir)
            ipfs_get_dir(item["Hash"], subdir)
        elif item["Type"] == 2:
            filename = cwd + "/" + item["Name"]
            with open(filename, "w") as f:
                f.write(ipfs.cat(item["Hash"]))



@cli.command(name="install")
@click.argument("name")
def cli_install_package(name):
    ipfs = dapple.plugins.load('core.get_ipfs')()


if __name__ == '__main__':
    dapple.plugins.load('ipfs.init_client')()
    package_dir = "testdir"
    output_dir = "testdir_get"
    package = ipfs.add(package_dir, recursive=True)[-1]
    package_hash = package["Hash"]

    os.mkdir(output_dir)
    get_dir = dapple.plugins.load('ipfs.get_dir')
    get_dir(package_hash, os.getcwd()+"/"+output_dir)
