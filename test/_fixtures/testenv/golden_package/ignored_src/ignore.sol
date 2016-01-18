contract FailsToCompile is MonkeyWrench {
    // This contract intentionally fails to compile.
    // This should never end up in the source stream,
    // as it isn't part of the "src" directory.
}
