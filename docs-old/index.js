var express = require('express'), docserver = require('docserver');
var port = 3000;

var app = express();
app.use(docserver({
  dir: __dirname,
  url: '/'
}));

app.listen(port);
console.log(docserver.version + ' listening on port ' + port);
