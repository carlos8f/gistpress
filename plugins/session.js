var app = require('that')
  , idgen = require('idgen')
  , cookies = require('cookies')
  , hydration = require('hydration')

app.router.first(cookies.connect(conf.get('session_keys')));

app.router.first(function (req, res, next) {
  var end = res.end;
  res.end = function (data) {
    
    if (Object.keys(req.session).length) {
      app.redis.SET
    }
    else if (req._sessData) {
      app.redis.DEL(app.redisKey('sess', req._sessKey)
    }
    end.call(res, data);
  };
  req._sessKey = req.cookies.get('s', {signed: true});
  if (req._sessKey) {
    app.redis.GET(app.redisKey('sess', req._sessKey), function (err, sess) {
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
        req._sessData = true;
      }
      else {
        req.session = {};
      }
      next();
    });
  }
  else {
    req.session = {};
    next();
  }
});