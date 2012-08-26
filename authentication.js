// Generated by CoffeeScript 1.3.3
(function() {
  var authenticate, crypto, model, salt, signup;

  crypto = require('crypto');

  model = require('./models');

  salt = 'My Cake is Very Not LOL';

  authenticate = function(userID, password, callback) {
    password = crypto.createHmac('sha1', salt).update(password).digest('hex');
    return model.UserModel().findOne({
      userID: userID
    }, function(err, user) {
      if (!userID || !user) {
        callback(err, null);
        return;
      }
      if (user.password === password) {
        callback(err, user);
        return;
      }
      return callback(err, null);
    });
  };

  signup = function(reqData, callback) {
    var UserModel, checkitem, checklist, _i, _len;
    checklist = [
      {
        condition: !reqData.userID,
        message: "ID를 입력하지도 않고 가입하려는 엄청난 패기로군"
      }, {
        condition: !reqData.nickname,
        message: "닉네임을 입력하는 것이 좋을듯합니다."
      }, {
        condition: !reqData.password1 || !reqData.password2,
        message: "보안을 위해 암호를 입력하는 것이 신상에 좋을것이요."
      }, {
        condition: !reqData.email,
        message: "이메일을 입력해주시면 참 고맙겠는데 말입니다."
      }, {
        condition: reqData.password1 !== reqData.password2,
        message: "비밀번호를 다르게 입력한듯 하기도 하고 아닌것 같기도 하고. 아무튼 다시 입력해 보세요."
      }, {
        condition: reqData.key !== 'zMFFNEM1227',
        message: "키를 잘못 입력하지 않았나스럽다."
      }
    ];
    for (_i = 0, _len = checklist.length; _i < _len; _i++) {
      checkitem = checklist[_i];
      if (checkitem.condition) {
        callback(null, null, checkitem.message);
        return;
      }
    }
    UserModel = model.UserModel();
    userData.userID = reqData.userID;
    userData.password = reqData.password1;
    userData.email = reqData.email;
    userData.nickname = reqData.nickname;
    return userData.save(function(err) {
      if (err && err.code === 11000) {
        console.log('duplicated id or nickname');
        return callback(err, null, '소환사께서 입력하신 아이디 혹은 닉네임은 이미 있는 것으로 사려되옵니다. 다른 아이디 혹은 닉네임을 입력해 주세요.');
      } else {
        return callback(err, userData);
      }
    });
  };

  exports.getLogin = function(req, res) {
    var context;
    context = {
      redir: req.header('referer')
    };
    return res.render('session/login', context);
  };

  exports.postLogin = function(req, res) {
    return authenticate(req.body.userID, req.body.password, function(err, user) {
      var redir;
      if (user) {
        req.session.user = user;
        redir = req.body.redir;
        return res.redirect(redir || '/');
      } else {
        return res.redirect('/login');
      }
    });
  };

  exports.getSignup = function(req, res) {
    return res.render('session/signup');
  };

  exports.postSignup = function(req, res) {
    return signup(req.body, function(err, user, message) {
      var context;
      if (message == null) {
        message = '';
      }
      if (user) {
        req.session.user = user;
        return res.redirect('/');
      } else {
        req.flash('warn', message);
        context = {
          redir: req.header('referer')
        };
        return res.render('session/signup', context);
      }
    });
  };

  exports.logout = function(req, res) {
    delete req.session.user;
    return res.redirect('/');
  };

  exports.getUserNickname = function(req, res) {
    return res.end(req.session.user.nickname);
  };

}).call(this);
