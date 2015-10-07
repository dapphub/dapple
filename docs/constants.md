Constants
---------

Constants are addresses defined via the `contexts` keys in a package's [dappfile](dappfile.md). Each context refers to a different chain environment and follows this structure:

* `contexts`
    * `default` - This is the default context when no context is specified.
        * `<some constant name>` - Keys and values defined at this level are constant names and values.
    * `<some context>` - You can define any other context name you like. Follows the same structure as `default`.

To refer to constants in your smart contract code, use `CONSTANT(<your constant name>)`. For example, given a dappfile containing this:

    contexts:
        default:
            namereg: '0x01010101'

You could do this:

    NameReg myNameReg = NameReg(CONSTANT(namereg));


Constants in dependencies
=========================

You can also refer to any constants defined in your dependencies via dot notation. So if the `core` package had a `namereg` constant, you could use it like this:

    NameReg officialNameReg = NameReg(CONSTANT(core.namereg))

You can use the same dot notation, also called the [package path](), to override constants in your dependencies as well:

    contexts:
        default:
            'core.namereg': '0x010101'

Such overrides only affect your package's copies of the dependencies referred to, of course.


Undefined constants
===================

Any undefined constants referred to will end up in the hex code output, allowing Dapple to replace them on the fly when running your deploy script. If your dappfile didn't contain the constant definition above, you might end up seeing something like this:

    $ dapple build
    {'Example': {'bin': '606060405269__CONSTANT(namereg)__600060006101000a81548173ffffffffffffffffffffffffffffffffffffffff02191690830217905550600a8060456000396000f360606040526008565b00', 'abi': '[]', 'interface': 'contract Example{}'}}


