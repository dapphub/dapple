This document describes the `dapple` developer workflow and the intermediate
data structures it generates. Chain management and testing is mostly left out
because it is the focus of Ryan's proposal.

This proposal should be read alongside `docs/definitions.md`.

 pre-`init` (on `npm install -g` or first `dapple init` run)

installs .dapplrc

`dapple init`

Converts the current directory into a **workspace** with a `dappfile` and misc boilerplate

`dapple install`

pull a **package** or **dapp** into dependencies

`dapple env new`
`dapple env ls`
`dapple env use`
`dapple env relink`

create / view environments. reproduce environment for a chain.

`dapple build`

makes a **source pack**

`dapple step` / `dapple run`

write to an environment by interacting with its chain

`dapple bundle`

collect the source pack and context into a dapp header


