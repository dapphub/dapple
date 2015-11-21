commands
===


`vmtest`
---

`VMTest.run` runs standard dapple `Test` contracts. Three steps are repeated for each `test*` function on each contract:

1. Create an instance
2. Call `setUp`
3. Call `test*`

`build`
---
Populates the `build` folder in a dapple package.
Source files are bundled and compiled.

`deploy`
---


`install/publish`
---
Package management.

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
