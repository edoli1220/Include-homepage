# Author: Daniel Jeon
# Date: 12. 8. 25

# Modules
crypto = require 'crypto'
model  = require './models'
salt   = 'My Cake is Very Not LOL'

# Check whether user data is correct authentication
# 안예쁘다. 리팩토링을 했으면 좋겠다.
authenticate = (userID, password, callback) ->
  password = crypto.createHmac('sha1', salt).update(password).digest('hex')
  model.UserModel().findOne
    userID: userID
  , (err, user) ->
      if !userID or !user
        callback err, null
        return
      if user.password == password
        callback err, user
        return
      callback err, null

signup = (reqData, callback) ->
  checklist = [
    condition: !reqData.userID
    message: "ID를 입력하지도 않고 가입하려는 엄청난 패기로군"
  , 
    condition: !reqData.nickname
    message: "닉네임을 입력하는 것이 좋을듯합니다."
  , 
    condition: !reqData.password1 or !reqData.password2
    message: "보안을 위해 암호를 입력하는 것이 신상에 좋을것이요."
  , 
    condition: !reqData.email
    message: "이메일을 입력해주시면 참 고맙겠는데 말입니다."
  , 
    condition: reqData.password1 != reqData.password2
    message: "비밀번호를 다르게 입력한듯 하기도 하고 아닌것 같기도 하고. 아무튼 다시 입력해 보세요."
  , 
    condition: reqData.key != 'zMFFNEM1227'
    message: "키를 잘못 입력하지 않았나스럽다."
  ]

  for checkitem in checklist
    if checkitem.condition 
      callback(null, null, checkitem.message)
      return

  UserModel = model.UserModel()
  userData.userID   = reqData.userID
  userData.password = reqData.password1
  userData.email    = reqData.email;
  userData.nickname = reqData.nickname
  userData.save (err) ->
    if err and err.code == 11000
      console.log 'duplicated id or nickname'
      callback err, null, '소환사께서 입력하신 아이디 혹은 닉네임은 이미 있는 것으로 사려되옵니다. 다른 아이디 혹은 닉네임을 입력해 주세요.'
    else
      callback err, userData

exports.getLogin = (req, res) ->
  context = 
    redir: req.header 'referer'
  res.render 'session/login', context

exports.postLogin = (req, res) ->
  authenticate req.body.userID, req.body.password, (err, user) ->
    if user
      req.session.user = user
      redir = req.body.redir
      res.redirect redir or '/'
    else
      res.redirect '/login'

exports.getSignup = (req, res) ->
  res.render 'session/signup'


exports.postSignup = (req, res) ->
  signup req.body, (err, user, message) ->
    message ?= ''
    if user
      req.session.user = user
      # 원래 있던 페이지로 돌아가게 하면 좋을듯
      res.redirect '/'
    else
      req.flash 'warn', message
      context = 
        redir: req.header 'referer'
      res.render 'session/signup', context

exports.logout = (req, res) ->
  delete req.session.user
  res.redirect '/'

exports.getUserNickname = (req, res) ->
  res.end req.session.user.nickname


