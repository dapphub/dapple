Plugins
-------

Every aspect of Dapple's core behavior is defined in terms of overrideable plugins. Plugin discovery is achieved via the `plugins` file in your package's `.dapple` directory. The `plugins` file is just a newline-delimited list of Python modules that Dapple will import each time it runs, before attempting to parse any arguments or commands. To write plugin, just write a Python module that does all its setup in its `__init__.py` file.

We have provided a few hooks into Dapple to facilitate plugin development:

* `dapple.cli` - Contains a `cli` object, which is an instance of the [Group](http://click.pocoo.org/5/api/#click.Group) class, and a `click` variable, which is a reference to the [Click](http://click.pocoo.org/5/api) module Dapple uses.
* `dapple.plugins` - Programmatic access to different functions defined by plugins.


Creating subcommands
====================

The `cli` object in `dapple.cli` allows you to register new Dapple commands. For example, to create a command called `hello` that just prints out `Hello World!`:

    from dapple.cli import cli

    @cli.command()
    def hello():
        print "Hello World!"

For more information, check out Click's documentation on the [Group](http://click.pocoo.org/5/api/#click.Group) class. The `cli` object is nothing more than an instance of that class.


dapple.plugins
==============

`dapple.plugins.registry` is a module-level instance of the [`PluginRegistry`](https://github.com/MakerDAO/dapple/blob/master/dapple/plugins.py#L7) class. This is hte registry plugins are registered with by default. Provides `load` and `register` functions, which the module-level `register` decorator and `load` function wrap.

`dapple.plugins.load` is a function that takes a plugin function name and returns the function registered under that name.

`dapple.plugins.register` is a decorator that takes a name to register the decorated function under. By convention, the name should be prefixed with the plugin's name, like so:

    @dapple.plugins.register('core.dappfile')
    function load_dappfile(package_path='', env=None):
        ... # plugin code

Any plugin loaded afterward can then get a reference to the function through `dapple.plugins.load`:

    load_dappfile = dapple.plugins.load('core.dappfile')
    dappfile = load_dappfile()

You may also override plugin functions by registering new functions by the same name after the original function has been registered:

    @dapple.plugins.register('core.dappfile')
    function my_dappfile(package_path='', env=None):
        # In case you want to use the original function somewhere.
        original_func = dapple.plugins.load('core.dappfile')
        dapple.plugins.registry.register('core.old_dappfile', original_func)
        ... # your altered plugin code

