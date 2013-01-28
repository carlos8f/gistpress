var app = require('that');

app.router.last(function (req, res, next) {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('page not found');
});