'use strict';

// This file's purpose is to open up Dapple for use as a library. Anything
// exported here may be considered an "edge" which external tools and libraries
// may interact with. No guarantees of API stability are made here, for Dapple
// is still in its early stages, but we will try to minimize and call out ahead
// of time any disruptions to the interfaces and behaviors of components
// exported here.

// Note that every stream and pipeline can be used directly as a Gulp plugin.

module.exports = require('lazreq')({
  pipelines: 'lib/pipelines.js',
  streams: 'lib/streams.js'
});
