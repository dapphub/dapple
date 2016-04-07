While package dappfiles contain settings relevant to their respective packages,
dapplerc files contain settings relevant to the global development environment.
Dapple creates a basic dapplerc file upon its first run. The file is saved under
the name `.dapplerc` in the user's home directory, at which point the user may
choose to customize it beyond what Dapple's dapplerc wizard allows for.
Understanding the format of dapplerc files is of course a necessary
prerequisite.

Note that the dapplerc format is still under development, so the information in
this document may occasionally fall out of step with reality. When in doubt,
consult the source code. The automated tests are the authority on intended
behavior.

Each dapplerc file includes at the top level an `environments` mapping of
environment names to IPFS and Ethereum client settings. Each environment name
either maps to another environment name, making it an alias for that
environment, or to a mapping with the keys `ethereum` and `ipfs`.

For example:

```yaml
environments:
    default:
        ipfs:
            host: 'localhost'
            port: '4001'
        ethereum:
            host: 'localhost'
            port: '8545'
```

The `default` environment is special. All other environments are derived from
it. If a setting is left undefined in an environment, the value of `default` is
taken. In other words...

```yaml
environments:
    default:
        ipfs:
            host: 'localhost'
            port: '4001'
        ethereum:
            host: 'localhost'
            port: '8545'
            account: '0xdeadbeef'

    internal:
        ethereum: 'internal'
```

...is equivalent to...

```yaml
environments:
    default:
        ipfs:
            host: 'localhost'
            port: '4001'
        ethereum:
            host: 'localhost'
            port: '8545'

    internal:
        ethereum: 'internal'
        ipfs:
            host: 'localhost'
            port: '4001'
```

The `'internal'` value for the `ethereum` key is also special. This indicates to
Dapple that it ought to spin up a fresh internal EVM chain and use that when
this environment is specified.

The `host` and `port` settings in both `ipfs` and `ethereum` tell Dapple how to
connect to IPFS and Ethereum via JSON-RPC. The `account` setting in `ethereum`
indicates which account to use when deploying and publishing packages via
`dapple deploy` and `dapple run`.
