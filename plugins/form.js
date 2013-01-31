var app = require('that')
  , formidable = require('formidable')

app.plugins.form = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) return next(err);
    req.body = fields;
    req.files = files;
    next();
  });
};