#!/bin/sh
WD=$TMPDIR/e2e
git clone https://github.com/nexusdev/rlp-calculator.git $WD
DAPPLEDIR=$(pwd)
cd $WD
node $DAPPLEDIR/cmd/main.js test
