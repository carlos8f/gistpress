describe('session', function () {
  var server, port, app = require('that'), sessId;

  var testData = {
    hello: 'world',
    number: 1,
    ok: true,
    started: new Date(),
    pattern: /blah/
  };

  before(function (done) {
    require('../bootstrap');
    require('../plugins/session');

    app.router
      .first(app.plugins.session)
      .get('/get', function (req, res, next) {
        assert.deepEqual(req.session, testData);
        sessId = req._session.id;
        res.writeHead(201);
        res.end();
      })
      .post('/set', function (req, res, next) {
        req.session = testData;
        res.writeHead(201);
        res.end();
      })
      .post('/regen', function (req, res, next) {
        req._session.regenerate();
        assert(req._session.id);
        assert.notEqual(req._session.id, sessId);
        assert.deepEqual(req.session, {});
        res.writeHead(201);
        res.end();
      })

    app.init(function (err) {
      if (err) return done(err);
      app.server.listen(0, function () {
        app.emit('ready');
        port = app.server.address().port;
        done();
      });
    });
  });

  it('set session', function (done) {
    request.post('http://localhost:' + port + '/set', function (err, resp, body) {
      assert.ifError(err);
      assert(resp.headers['set-cookie']);
      done();
    });
  });

  it('get session', function (done) {
    request.get('http://localhost:' + port + '/get', function (err, resp, body) {
      assert.ifError(err);
      assert(!resp.headers['set-cookie']);
      done();
    });
  });

  it('get session again', function (done) {
    request.get('http://localhost:' + port + '/get', function (err, resp, body) {
      assert.ifError(err);
      assert(!resp.headers['set-cookie']);
      done();
    });
  });

  it('regen session', function (done) {
    request.post('http://localhost:' + port + '/regen', function (err, resp, body) {
      assert.ifError(err);
      assert(resp.headers['set-cookie']);
      done();
    });
  });
});