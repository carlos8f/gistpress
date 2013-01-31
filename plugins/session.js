var app = require('that')
  , idgen = require('idgen')
  , cookies = require('cookies')
  , hydration = require('hydration')
  , crypto = require('crypto')

app.router.first(cookies.connect(conf.get('session_keys')));

app.router.first(function (req, res, next) {
  var end = res.end;
  res.end = function (data) {
    if (sessChecksum(req.session) !== req._sess.checksum) {
      app.redis.SETEX(app.redisKey('sess', req._sess.key))
    }
    else if (req._sessData) {
      app.redis.DEL(app.redisKey('sess', req._sessKey)
    }
    end.call(res, data);
  };

});

function Session () {};

Session.getChecksum = function (data) {
  return crypto.createHash('sha1')
    .update(JSON.stringify(data))
    .digest('hex');
};

Session.prototype.regenerate = function (req, res, next) {
  if (this.key) {
    app.redis.DEL(app.redisKey('sess', this.key));
  }
  this.key = idgen(16);
  req.session || (req.session = {});
  req._sess.checksum = Session.getChecksum(req.session);
  next();
};

Session.prototype.fetch = function (req, res, next) {
  var self = this;
  req.session = {};
  req._sess = {};
  this.key = req.cookies.get(app.conf.get('session:cookie:name'), {signed: true});
  if (this.key) {
    app.redis.GET(app.redisKey('sess', this.key), function (err, sess) {
      if (err) return next(err);
      if (sess) {
        try {
          sess = JSON.parse(sess);
          sess = hydration.hydrate(sess);
        }
        catch (e) {
          return next(e);
        }
        req.session = sess;
        req._sessChecksum = Session.getChecksum(req.session);
        next();
      }
      else {
        return self.regenerate(req, res, next);
      }
    });
  }
  else {
    self.regenerate(req, res, next);
  }
};

Session.prototype.write = function (req, res, next) {
  if ()
};