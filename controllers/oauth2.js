var app = require('that')
  , url = require('url')
  , request = require('request')

app.router.get('/oauth2/authorize', function (req, res, next) {
  var redirect = url.format({
    protocol: 'https',
    hostname: 'github.com',
    pathname: '/login/oauth/authorize',
    query: {
      client_id: app.conf.get('client_id'),
      scope: 'gist'
    }
  });

  res.writeHead(302, {'Location': redirect});
  res.end();
});

app.router.get('/oauth2/callback', function (req, res, next) {
  var code = url.parse(req.url, true).query.code;
  if (!code) {
    res.writeHead(500, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({error: 'no code provided'}), null, 2);
    return;
  }
  request.post({
    url: 'https://github.com/login/oauth/access_token',
    json: {
      client_id: app.conf.get('client_id'),
      client_secret: app.conf.get('client_secret'),
      code: code
    }
  }, function (err, resp, body) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(err), null, 2);
    }
    else if (resp.statusCode !== 200) {
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(resp), null, 2);
    }
    else {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify(body), null, 2);
    }
  });
});