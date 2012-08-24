
var qs 
  , socket
  , currentFile
  , formidable;
  
formidable      = require('formidable');
qs     = require('qs');
socket = require('./socket');

function mime(req) {
  var str = req.headers['content-type'] || '';
  return str.split(';')[0];
}

function error(code){
  var err = new Error(http.STATUS_CODES[code]);
  err.status = code;
  return err;
};

var multipart = module.exports = function(options){
  options = options || {};
  return function multipart(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};
    req.files = req.files || {};

    // ignore GET
    if ('GET' == req.method || 'HEAD' == req.method) return next();

    // check Content-Type
    if ('multipart/form-data' != mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    var form = new formidable.IncomingForm
      , data = {}
      , files = {}
      , done;

    Object.keys(options).forEach(function(key){
      form[key] = options[key];
    });

    function ondata(name, val, data){
      if (Array.isArray(data[name])) {
        data[name].push(val);
      } else if (data[name]) {
        data[name] = [data[name], val];
      } else {
        data[name] = val;
      }
    }

    
    form.on('field', function(name, val){
      ondata(name, val, data);
    });

    form.on('progress', function(bytesReceived, bytesExpected){
      socket.socket().emit('dataProgress', {
        progressPercent: bytesReceived / bytesExpected * 100
      });
    });

    form.on('file', function(name, file){
      ondata(name, file, files);
    });
    form.on('fileBegin', function(name, file) {
      currentFile = file;
    });
    form.on('error', function(err){
      next(err);
      done = true;
    });

    form.on('end', function(){
      if (done) return;
      try {
        req.body = qs.parse(data);
        req.files = qs.parse(files);
        next();
      } catch (err) {
        next(err);
      }
    });

    form.parse(req);
  }
};


var json = module.exports = function(options){
  options = options || {};
  return function json(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    // ignore GET
    if ('GET' == req.method || 'HEAD' == req.method) return next();

    // check Content-Type
    if ('application/json' != mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    var buf = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ buf += chunk });
    req.on('end', function(){
      if ('{' != buf[0] && '[' != buf[0]) return next(error(400));
      try {
        req.body = JSON.parse(buf);
        next();
      } catch (err){
        err.status = 400;
        next(err);
      }
    });
  }
};

var urlencoded = module.exports = function(options){
  options = options || {};
  return function urlencoded(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};

    // ignore GET
    if ('GET' == req.method || 'HEAD' == req.method) return next();

    // check Content-Type
    if ('application/x-www-form-urlencoded' != mime(req)) return next();

    // flag as parsed
    req._body = true;

    // parse
    var buf = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ buf += chunk });
    req.on('end', function(){
      try {
        req.body = buf.length
          ? qs.parse(buf, options)
          : {};
        next();
      } catch (err){
        next(err);
      }
    });
  }
};

exports = module.exports = function bodyParser(options){
  var _urlencoded = urlencoded(options)
    , _multipart = multipart(options)
    , _json = json(options);

  return function bodyParser(req, res, next) {
    _json(req, res, function(err){
      if (err) return next(err);
      _urlencoded(req, res, function(err){
        if (err) return next(err);
        _multipart(req, res, next);
      });
    });
  }
};