var app = require('that');

require('./bootstrap');

require('./plugins/session');
app.router.first(app.session);

require('./controllers');

app.init(function (err) {
  if (err) throw err;
  app.server.listen(app.conf.get('port'), function () {
    app.emit('ready');
    console.log('listening on port ', app.server.address().port);
  });
});