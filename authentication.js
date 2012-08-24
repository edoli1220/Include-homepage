/**
 * Created with JetBrains WebStorm.
 * User: user
 * Date: 12. 5. 8
 * Time: 오후 9:26
 * To change this template use File | Settings | File Templates.
 */

var model
  , isAuthenticated
  , salt
  , crypto
  , authenticate
  , signup;

crypto = require('crypto');
model  = require('./models');
salt   = 'My Cake is Very Not LOL'

authenticate = function(userID, password, callback) {
  model.UserModel().findOne({userID: userID}, function(err, user) {
    if (!userID || !user) {
      callback(null);
      return;
    }
    if (user.password == crypto.createHmac('sha1', salt).update(password).digest('hex')) {
      callback(user);
      return;
    }
    callback(null);
  });
};

signup = function(reqData, callback) {
  var userData
    , userModel;
  if (!reqData.userID) {
    callback(null, 'ID를 입력하지도 않고 가입하려는 엄청난 패기로군');
    return;
  }
  if (!reqData.nickname) {
    callback(null, '닉네임을 입력하는 것이 좋을듯합니다.');
    return;
  }
  if (!reqData.password1 || !reqData.password2) {
    callback(null, '보안을 위해 암호를 입력하는 것이 신상에 좋을것이요.');
    return;
  }
  if (!reqData.email) {
    callback(null, '이메일을 입력해주시면 참 고맙겠는데 말입니다.');
    return;
  }
  if (reqData.password1 != reqData.password2) {
    callback(null, '비밀번호를 다르게 입력한듯 하기도 하고 아닌것 같기도 하고. 아무튼 다시 입력해 보세요.');
    return;
  }
  if (reqData.key != 'zMFFNEM1227') {
    callback(null, '키를 잘못 입력하지 않았나스럽다.');
    return;
  }

  userModel = model.UserModel();

  reqData.password1 = crypto.createHmac('sha1', salt).update(reqData.password1).digest('hex');

  userData = new userModel();
  userData.userID   = reqData.userID;
  userData.password = reqData.password1;
  userData.email    = reqData.email;
  userData.nickname = reqData.nickname;
  userData.save(function(err) {
    if (err) {
      if (err.code == 11000) {
        console.log('dup');
        callback(null, '소환사께서 입력하신 아이디 혹은 닉네임은 이미 있는 것으로 사려되옵니다. 다른 아이디 혹은 닉네임을 입력해 주세요.');
      }
    } else {
      console.log('signup success');
      console.log('--' + userData);
      callback(userData);
    }
  });
  return;
};

exports.getLogin = function(req, res) {
  res.render('sessions/login', {redir: req.headers.referer});
};

exports.postLogin = function(req, res) {
  authenticate(req.body.userID, req.body.password, function(user) {
    if (user) {
      req.session.user = user;
      res.redirect(req.body.redir || '/');
      return;
    } else {
      res.render('sessions/login', {redir: req.body.redir});
      return;
    }
  });
};

exports.getSignUp = function(req, res) {
  res.render('sessions/signup', {message: ''});
};

exports.postSignUp = function(req, res) {
  signup(req.body, function(user, message) {
    if (!message) {
      message = '';
    }
    if (user) {
      req.session.user = user;
      res.redirect('/');
    } else {
      res.render('sessions/signup', {message: message});
    }
  });
};

exports.logout = function(req, res) {
  delete req.session.user;
  res.redirect('/');
};

exports.getUserNickname = function(req, res) {
  res.end(req.session.user.nickname);
};
