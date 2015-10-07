.dapplerc
---------

Your .dapplerc file contains Dapple's global settings. It can be found in your home directory.(The `~` command line path for OS X and Linux users.)

.dapplerc is a [YAML](http://yaml.org/) file with the following structure:

* `ipfs` - Settings related to connecting to IPFS.
    * `host` - The hostname for the IPFS node. Can start with 'http://' or 'https://'.
    * `port` - This port on the IPFS node to connect to. Usually `80` or `8080` for read-only gateways and `5001` for full nodes.
