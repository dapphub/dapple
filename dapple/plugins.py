"""
Dapple's plugin system.

"""
from . import DappleException

class PluginRegistry(object):
    """
    A singleton-like class for registering and retrieving plugins.
    Uses the Borg pattern:
    http://code.activestate.com/recipes/66531-singleton-we-dont-need-no-stinkin-singleton-the-bo/

    """
    __plugins = {}

    def load(self, plugin, settings):
        if plugin not in self.__plugins:
            raise DappleException("Could not find plugin '%s'!" % plugin)

        return self.__plugins[plugin]

    def register(self, name, plugin_class):
        self.__plugins[name] = plugin_class

def register(name):
    """
    A decorator for making plugin registration easier.

    """
    registry = PluginRegistry()

    def _(plugin):
        registry.register(name, plugin)
        return plugin

    return _
