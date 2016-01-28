module.exports = {
  optionalCallback: function (cb) {
    if (typeof (cb) === 'undefined') {
      cb = function (err, result) {
        if (err) { throw err; }
        return result;
      };
    }
    return cb;
  },

  classToFilename: function (className) {
    var filename = '';
    for (var i = 0; i < className.length; i++) {
      if (i !== 0 && className[i] !== className[i].toLowerCase()) {
        filename += '_';
      }
      filename += className[i].toLowerCase();
    }
    return filename + '.sol';
  }
};
