"""
Dapple's plugin system.

"""
from . import DappleException

class PluginRegistry(object):
    """
    A singleton-like class for registering and retrieving plugins.

    """
    def __init__(self):
        self.plugins = {}

    def load(self, plugin):
        if plugin not in self.plugins:
            raise DappleException("Could not find plugin '%s'!" % plugin)

        return self.plugins[plugin]

    def register(self, name, plugin_class):
        self.plugins[name] = plugin_class

# Provide a default registry.
registry = PluginRegistry()

def load(plugin):
    """
    A helper function for loading plugins from the default registry.

    """
    return registry.load(plugin)

def register(name, registry=registry):
    """
    A decorator for making plugin registration easier.

    """
    def _(plugin):
        registry.register(name, plugin)
        return plugin

    return _
