module.exports = {
    optionalCallback: function (cb) {
        if (typeof(cb) == "undefined") {
            cb = function(err, result) {
                if (err) { throw err; }
                return result;
            };
        }
        return cb;
    }
}
