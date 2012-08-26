# Modules
express        = require 'express'
http           = require 'http'
path           = require 'path'
fs             = require 'fs'
util           = require 'util'
stylus         = require 'stylus'
nib            = require 'nib'
io             = require 'socket.io'
colors         = require 'colors'
flashify       = require 'flashify'

# Routes
routes         = require './routes/index'
board          = require './board'
authentication = require './authentication'
socket         = require './socket'

app = express()

# Log
fileName = __dirname + '/logs/log.txt'
fileStream = fs.createWriteStream fileName

# error handler
fileStream.addListener 'error', (err) ->
  util.debug err

# 세션 저장을 위한 메모리 저장소
MemStore = express.session.MemoryStore;

# Session Option
sessionOpt =
  secret: 'Nothing Cake'
  store: MemStore 
    reapInterval: 60000 * 10

# Stylus Option
stylusOpt =
  src: __dirname + '/public'
  compile: (str, path) ->
    compile = stylus str
    compile.set 'filename', path
    compile.use nib()
    compile.import 'nib'
    return compile

# 로그인 확인 함수
isAuthenticated = (req, res, next) ->
  if req.session.user
    isAuthenticated = true;
  else
    isAuthenticated = false;
  res.locals.isAuthenticated = isAuthenticated
  next()

# Locals
app.locals = 
  title: "인클루드" 

# Server Configuration
app.configure ->
  app.set 'views', __dirname + '/views'
  app.set 'view engine', 'jade'
  app.use express.cookieParser()
  app.use express.session sessionOpt
  app.use flashify
  app.use express.favicon()
  app.use express.logger 'dev'
  app.use express.bodyParser()
  app.use stylusOpt
  app.use isAuthenticated
  app.use app.router
  app.use express.static path.join __dirname, 'public'

# Development Server Configuration
app.configure 'development', ->
  app.use express.errorHandler
    dumpExceptions: true
    showStack: true
  app.set 'port', 3013
  console.log 'server running in ' + 'development'.green + ' mode'

# Production Server Configuration
app.configure 'production', ->
  app.use express.errorHandler()
  app.set 'port', 3014
  console.log 'server running in ' + 'production'.green + ' mode'

# Require Login
requiresLogin = (req, res, rext) ->
  if req.session.user
    next()
  else
    res.redirect('/login')

# Session
app.get '/login'       , authentication.getLogin
app.get '/signup'      , authentication.getSignup
app.get '/logout'      , authentication.logout
app.get '/usernickname', authentication.getUserNickName

app.post '/login' , authentication.postLogin
app.post '/signup', authentication.postSignup

# Routes
app.get '/'          , routes.index
app.get '/about'     , routes.about
app.get '/projects'  , routes.projects
app.get '/studies'   , routes.studies
app.get '/activities', routes.activities
app.get '/ingcam'    , requiresLogin, routes.ingcam

app.get '/board/file', board.getBoardFile
app.get '/board/check/:board', board.checkBoard

app.get '/board/:board', board.listBoard
app.get '/board/:board/new', board.newBoard
app.get '/board/:board/read/:id', board.readBoard
app.get '/board/:board/edit/:id', board.editBoard

#get -> post
app.get '/board/:board/delete/:id', board.deleteBoard

app.post '/board/:board', board.postBoard
app.post '/board/:board/:id', board.updateBoard
app.post '/board/:board/:id/comment', board.postComment
app.post '/board/:board/:id/comment/del', board.deleteComment

# Start Server
server = http.createServer app
server.listen app.get('port'), ->
  console.log "Express server listening on port %d in %s mode"
    , app.get('port'), app.settings.env

# Start Socket.io
io = io.listen server
socket.setSocketIO io