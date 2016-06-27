### EACCESS Error
If you get EACCES (access denied) errors, don't use sudo, try this:

```
$ mkdir ~/npm-global
$ npm config set prefix ~/npm-global
$ echo 'export PATH="$PATH:$HOME/npm-global/bin"' >>~/.bashrc
$ source ~/.bashrc
$ npm install -g dapple
```
