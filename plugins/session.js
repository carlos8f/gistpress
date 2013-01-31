var app = require('that')
  , idgen = require('idgen')
  , Cookies = require('cookies')
  , hydration = require('hydration')
  , crypto = require('crypto')
  , Keygrip = require('keygrip')

app.conf.add({
  session: {
    cookie: {
      expires: 2592000,
      name: 's',
      signed: true
    },
    keys: [ idgen(16) ]
  }
});

var keys = new Keygrip(app.conf.get('session:keys'));
var cookieOptions = app.conf.get('session:cookie') || {};

function Session () {};
app.plugins.session = function (req, res, next) {
  (new Session()).middleware(req, res, next);
};

Session.getChecksum = function (data) {
  return crypto.createHash('sha1')
    .update(JSON.stringify(data))
    .digest('hex');
};

Session.prototype.regenerate = function (updateChecksum) {
  if (this.id) {
    app.redis.DEL(app.redisKey('sess', this.id));
  }
  this.id = idgen(16);
  this.req.session = {};
  if (updateChecksum) {
    this.checksum = Session.getChecksum(this.req.session);
  }
};

Session.prototype.maybeSendCookie = function () {
  if (this.res._sentSessionCookie) return;
  if (Session.getChecksum(this.req.session) === this.checksum) return;

  var options = {};
  Object.keys(cookieOptions).forEach(function (k) {
    options[k] = cookieOptions[k];
  });
  options.expires = new Date(Date.now() + (options.expires * 1000));

  this.cookies.set(options.name, this.id, options);
  this._sentSessionCookie = true;
};

Session.prototype.middleware = function (req, res, next) {
  var self = this;

  this.req = req;
  this.res = res;
  this.cookies = new Cookies(req, res, keys);
  req._session = res._session = this;
  this._sentSessionCookie = false;

  var writeHead = res.writeHead;
  res.writeHead = function () {
    self.maybeSendCookie();
    writeHead.apply(res, [].slice.call(arguments));
  };

  var end = res.end;
  res.end = function (data) {
    if (Session.getChecksum(req.session) !== self.checksum) {
      var sess = JSON.stringify(hydration.dehydrate(req.session));
      app.redis.SETEX(app.redisKey('sess', self.id), cookieOptions.expires, sess, function (err) {
        if (err) return next(err);
        end.call(res, data);
      });
    }
    else {
      end.call(res, data);
    }
  };

  this.id = this.cookies.get(cookieOptions.name, {signed: cookieOptions.signed});
  if (this.id) {
    app.redis.GET(app.redisKey('sess', this.id), function (err, sess) {
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
        self.checksum = Session.getChecksum(req.session);
      }
      else {
        self.regenerate(true);
      }
      next();
    });
  }
  else {
    self.regenerate(true);
    next();
  }
};