
/*
 * GET home page.
 */
var fs = require('fs');

function isAuthenticated(req) {
  var isAuthenticated;
  if (req.session.user) {
    isAuthenticated = true;
  } else {
    isAuthenticated = false;
  }
  return isAuthenticated;
}

exports.index = function(req, res) {
  res.render('index', { isAuthenticated: isAuthenticated(req) })
};

exports.about = function(req, res) {
  var includeAbout;

  res.render('about', { isAuthenticated: isAuthenticated(req) })
};

exports.ingcam = function(req, res) {
  res.render('ingcam', { isAuthenticated: isAuthenticated(req) })
};

exports.projects = function(req, res) {
  res.render('projects', { isAuthenticated: isAuthenticated(req) })
}

exports.studies = function(req, res) {
  res.render('studies', { isAuthenticated: isAuthenticated(req) })
}

exports.activities = function(req, res) {
  res.render('activities', { isAuthenticated: isAuthenticated(req) })
}

exports.quickImage = function(req, res) {
  var fName
    , fSize
    , fType
    , fURL
    , ws
  
  fName = req.header('file-name');
  fSize = req.header('file-size');
  fType = req.header('file-type');
  fURL  = '/quick-images/' + fName;
  ws    = fs.createWriteStream('public' + fURL);
  
  req.on('data', function(data) {
    ws.write(data);
  });
  
  res.json({
      sFileName: fName
    , sFileURL : fURL
    , bNewLine : true
  });
}
