
### Can I use TestRPC with dapple?
If you are using TestRPC, remember that `dapple run` has a default block
confirmation time of one block. To prevent a deadlock you need to turn off the
confirmation time testrpc environment:
```
environments:
    test:
        confirmationBlocks: 0
```

### EACCESS Error
If you get EACCES (access denied) errors, don't use sudo, try this:

```
$ mkdir ~/npm-global
$ npm config set prefix ~/npm-global
$ echo 'export PATH="$PATH:$HOME/npm-global/bin"' >>~/.bashrc
$ source ~/.bashrc
$ npm install -g dapple
```
