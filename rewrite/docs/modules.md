commands
===

build
---
Populates the `build` folder in a dapple package.
Source files are bundled and compiled.

deploy
---


vmtest
---
processes `dapple.test.Test` and `dapple.debug.Debug` events in a local VM

install/publish
---
Package management. Package validation is critical.

chain
---
Blockchain management.

internal
===

ipfs
---

DSL
---
Deploy sequence language

workspace
---
Code for dealing with dapple workspace and config.
All interactions with filesystem should be contained to this module.
