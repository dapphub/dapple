from __future__ import print_function

__version__ = '0.0.1a'

def deep_merge(d1, d2):
    """Merge two dictionaries such that any nested
    directories are also merged together. Example:

    >>> foo = {'foo': {'one': 1}}
    >>> bar = {'foo': {'two': 2}}
    >>> expected = {'foo': {'one': 1, 'two': 2}}
    >>> deep_merge(foo, bar) == expected
    True

    Simply using `update` would have produced this
    undesirable result:
    >>> foo = {'foo': {'one': 1}}
    >>> foo.update({'foo': {'two': 2}})
    >>> print foo
    {'foo': {'two': 2}}
    """
    for key in d2:
        if key in d1:
            if isinstance(d1[key], dict) and isinstance(d2[key], dict):
                deep_merge(d1[key], d2[key])
            elif isinstance(d1[key], dict) or isinstance(d2[key], dict):
                raise Exception("Cannot merge YAML key `%s`: only one value is a mapping!")
            else:
                d1[key] = d2[key]
        else:
            d1[key] = d2[key]

    return d1


def expand_dot_keys(yaml_dict):
    """Expand dot keys in a dictionary into
    nested dictionaries. For example:

    >>> yaml = {'foo.bar.one': 1, 'foo.bar.two': 2}
    >>> expand_dot_keys(yaml)
    {'foo': {'bar': {'one': 1, 'two': 2}}}

    Or even:
    >>> yaml = {'foo': {'bar.one': 1, 'bar': {'two': 2}}}
    >>> expand_dot_keys(yaml)
    {'foo': {'bar': {'one': 1, 'two': 2}}}
    """
    result = {}
    for key, val in yaml_dict.iteritems():
        if isinstance(val, dict):
            yaml_dict[key] = expand_dot_keys(val)

        if '.' not in key:
            result[key] = yaml_dict[key]

        else:
            subdict = yaml_dict[key]
            for piece in reversed(key.split('.')):
                subdict = {piece: subdict}
            result = deep_merge(result, subdict)

    return result

class DappleException(Exception):
    pass
