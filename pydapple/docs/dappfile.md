dappfile
--------

Your pacakge's dappfile contains all the settings necessary to set up dependencies and compile your package's code properly. It is a YAML file with the following structure:

* `name`: The name of the dapple package. (Required)

* `version`: The version of the dapple package. (Required)

* `source_dir`: By default, Dapple will process all source files in the project's root directory and its descendants. It will also interpret imports relative to the project's root directory during the build process. This setting overrides this behavior and allows you to specify a subfolder of the project to use instead.

* `ignore`: A list of filenames to ignore. [Globbing](https://en.wikipedia.org/wiki/Glob_%28programming%29) is supported.

* `preprocessor_vars`: Variables to pass in for your preprocessor or templating engine to use in its rendering context. Dapple uses [cogapp](http://pypi.python.org/pypi/cogapp) by default.

* `contexts`: A mapping of environment names to constants and their values. Constants may be inserted into smart contract source code at any point via `CONSTANT:"some_constant"`.

* `dependencies`: A mapping of the names of dapple packages this package depends on to the specific versions of those packages required, or to the specific location to load the package from. A value of "latest" signifies that the latest version should be used.

You may use dot notation to collapse nested mappings. In other words, this:

    contexts:
        prod:
            NAME_REG: "0x..."

Can be shortened to this:

    contexts.prod.NAME_REG: "0x..."

