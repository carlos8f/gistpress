var app = require('that');

// project root
app.root = __dirname;

// conf
app.conf = require('etc')();
app.conf.use(require('etc-yaml'));
app.conf.folder(app.root + '/etc');

// event chaining
require('eventflow')(app);

// redis
app.redis = require('haredis').createClient(
  app.conf.get('redis:nodes'),
  app.conf.get('redis')
);
app.redisKey = function () {
  return [app.conf.get('redis:prefix')]
    .concat([].slice.call(arguments))
    .join(':');
};

// server
app.server = require('http').createServer();

// router
app.router = require('middler')(app.server);

// init method
app.init = function (cb) {
  app.series('init', cb);
};

// plugins (placeholder)
app.plugins = {};