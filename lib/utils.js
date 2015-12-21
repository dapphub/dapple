module.exports = {
    optionalCallback: function (cb) {
        if (typeof(cb) == "undefined") {
            cb = (e, r) => e || r;
        }
        return cb;
    }
}
