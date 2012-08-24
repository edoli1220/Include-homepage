

var express        = require('express')
  , fs             = require('fs')
  , util           = require('util')
  , stylus         = require('stylus')
  , io             = require('socket.io')
  , routes         = require('./routes/index')
  , board          = require('./board')
  , authentication = require('./authentication')
  , bodyParser     = require('./bodyParser')
  , socket         = require('./socket')
  , port;

var app = module.exports = express.createServer();
io = io.listen(app);

var MemStore = express.session.MemoryStore;

// Log

var fileName = __dirname + '/logs/hello_log.txt';
var fileStream = fs.createWriteStream(fileName);

// error handler
fileStream.addListener('error', function(err) {
    util.debug(err);
});

// Configuration
  
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use (function(req, res, next) {
    var options
      , bodyParserFunction;
    options = {};
    bodyParserFunction = bodyParser(options);
    bodyParserFunction(req, res, next);
  });
  app.use(express.cookieParser());
  app.use(express.session({
    store: MemStore({reapInterval: 60000 * 10 })
    , secret: 'Nothing Cake'}));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
  app.use(express.logger({stream: fileStream}));
  app.use(stylus.middleware({ src: __dirname + '/public', compress: true }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  port = 3020;
  console.log('development');
});

app.configure('production', function(){
  app.use(express.errorHandler());
  port = 3017;
  console.log('production');
});

app.configure('test', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

function requiresLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login?redir=' + req.url); // 로그인이 안되어 있을시 로그인 redirect
  }
};

/* Sessions */

app.get('/login' , authentication.getLogin);
app.post('/login', authentication.postLogin);

app.get('/signup' , authentication.getSignUp);
app.post('/signup', authentication.postSignUp);

app.get('/userNickname' , authentication.getUserNickname);

app.get('/logout', authentication.logout)

// Routes

app.get('/'          , routes.index);
app.get('/about'     , routes.about);
app.get('/projects'  , routes.projects);
app.get('/studies'   , routes.studies);
app.get('/activities', routes.activities);
app.get('/ingcam'    , requiresLogin, routes.ingcam);

app.get( '/board/file'                  , board.getBoardFile);
app.get( '/board/check/:board'          , board.checkBoard);
app.get( '/board/:board/new'            , board.newBoard);
app.post('/board/:board'                , board.postBoard);
app.get( '/board/:board'                , board.listBoard);
app.get( '/board/:board/read/:id'       , board.readBoard);
app.post('/board/:board/:id'            , board.updateBoard);
app.get( '/board/:board/delete/:id'     , board.deleteBoard);
app.get( '/board/:board/edit/:id'       , board.editBoard);
app.post('/board/:board/:id/comment'    , board.commentBoard);
app.post('/board/:board/:id/comment/del', board.deleteCommentBoard); 

app.post('/quick', routes.quickImage);

app.listen(port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

socket.setSocketIO(io);