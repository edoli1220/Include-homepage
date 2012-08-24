var model
  , documentModel
  , availableBoards
  , fs
  , boardName
  , gridStore
  , deleteGridStore
  , readGridStore;
  
model           = require('./models');
util            = require('util');
documentModel   = model.DocumentModel;
availableBoards = model.AvailableBoard;
gridStore       = model.saveGridStore;
deleteGridStore = model.deleteGridStore;
readGridStore   = model.readGridStore;
fs              = require('fs');


// 로그인 확인 함수
function isAuthenticated(req) {
  var isAuthenticated;
  if (req.session.user) {
    isAuthenticated = true;
  } else {
    isAuthenticated = false;
  }
  return isAuthenticated;
}

// 문서가 있는지 확인 .. req가 들어오면 작성자의 글인지 확인
function isValidDocument(err, document, req) {
  if (err || !document) {
    return false;
  }
  if (req) {
    if (document.writer != (req.session.user && req.session.user.nickname)) {
      return false; 
    }
  }
  return true;
}

// 사용 가능 보드 확인
function isAvailableBoard(boardName, req, res, callback) {
  var resJson;
  
  if (arguments.length == 3) {
    callback = arguments[2];
    res = null;
  }
  
  resJson = {};
  resJson.isAvailable = true;
  if (boardName) {
    resJson.boardName = boardName;
  }
  availableBoards().findOne({'boardName': boardName}, function(err, board) {
    if (!board) {
      resJson.type = 0;
      resJson.isAvailable = false;
    } else {
      // 로그인 사용 가능 보드 확인
      if (board.auth && !isAuthenticated(req)) {
        resJson.type = 1;
        resJson.isAvailable = false;
      }
    }
    
    if (res && !resJson.isAvailable) {
      res.redirect('/?board=' + resJson.boardName + '&type=' + resJson.type);
      return; 
    }
    
    callback(resJson);
  });
}

// Board List
exports.listBoard = function (req, res) {
  var upper
    , lower
    , index
    , numbers
    , model
    , maxIndex;
    
  if (req.query.index) {
    index = req.query.index;
  } else {
    index = 1;
  }

  boardName = req.params.board;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    model = documentModel(boardName);
    
    model.count(function(err, count) {
    upper = count - index * 15 + 15;
    lower = count - index * 15 + 1;

    numbers = [];
    maxIndex = (count / 15);
    for (i = 0; i < maxIndex; i++) {
      numbers[i] = i + 1;
    }

    model.find()
      .skip(15 * index - 15)
      .limit(15)
      .sort('id', -1)
      .run(function(err, documents) {
        res.render('board/listBoard', {
            documents      : documents
          , boardName      : boardName
          , numbers        : numbers
          , isAuthenticated: isAuthenticated(req)
        });
        return;
      });
    });
  });

  
};

// Read Document
exports.readBoard = function(req, res) {
  var id
    , content;
  id        = req.params.id;
  boardName = req.params.board;

  isAvailableBoard(boardName, req, res, function(resJson) {
    
    documentModel(boardName).findById(id, function(err, document) {
      if (!isValidDocument(err, document)) {
        res.redirect('/board/'+boardName);
        return;
      }
  
      res.render('board/readBoard', {
          document       : document
        , boardName      : boardName
        , isAuthenticated: isAuthenticated(req)
        , user           : req.session.user
        , isWriter       : (document.writer == (req.session.user && req.session.user.nickname))
      });
      return;
    });
  });  
};

// Post new Document
exports.postBoard = function(req, res) {
  var document
    , documentData
    , dataFile
    , file
    , buffer
    , index
    , date;
  
  boardName = req.params.board;
  isAvailableBoard(boardName, req, res, function(resJson) {
        
    documentModel(boardName).find()
    .sort('id', -1)
    .limit(1)
    .run(function (err, documents) {

      document = documents[0];
      if (document) {
        index = document.id + 1;
      } else {
        index = 0;
      }

      if (req.body.title === '') {
        req.body.title = '제목없음';
      }
      
      var date = Date.now()
      documentData          = new (documentModel(boardName))();
      documentData.id       = index;
      documentData.title    = req.body.title;
      documentData.writer   = req.session.user.nickname;
      documentData.content  = req.body.content;
      documentData.date     = date;
      documentData.comments = [];
      documentData.files    = [];
      
      for (var key in req.files) {
        dataFile = req.files[key];
        if (dataFile.size > 0) {
          file = fs.readFileSync(dataFile.path)
          gridStore(documentData._id + dataFile.name , file);
          documentData.files.push(documentData._id + dataFile.name);
          //documentData.files.push({name: dataFile.name, data: buffer.toString('base64')});
        }
      }
      
      documentData.save(function (err) {
        res.end('/board/' + boardName);
        return;
      });
    });
  });
};

// Update Document
exports.updateBoard = function(req, res) {
  var id
    , dataFile
    , file
    , buffer
    , conditions
    , updates
    , model
    , fileLength
    , date;

  boardName = req.params.board;
  id        = req.params.id;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    model = documentModel(boardName);
    
    model.findById(id, function(err, document) {
      if (!isValidDocument(err, document, req)) {
        res.redirect('/board/'+boardName);
        return;
      }
  
      if (req.body.title == '') {
        req.body.title = '제목없음';
      }
      conditions = {'_id': id};
      
      date = Date.now();
  
      updates = {};
      updates.title   = req.body.title;
      updates.content = req.body.content;
      updates.date    = date;
  
      var i = 0;
      updates.files = [];
      //원본 파일 집어넣기
      updates.files = document.files;
      fileLength = updates.files.length;
  
      for (var key in req.files) {
        dataFile = req.files[key];
        if (dataFile.size > 0) {
          file = fs.readFileSync(dataFile.path)
          gridStore(document._id + dataFile.name, file);
          updates.files.push(document._id + dataFile.name);
        }
        i ++;
      }
  
      model.update(conditions, updates, function(err) {
        res.end('/board/' + boardName);
        return;
      });
    });
  });


};

// Delete Document
exports.deleteBoard = function(req, res) {
  var id
    , length;

  boardName = req.params.board;
  id        = req.params.id;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    documentModel(boardName).findById(id, function(err, document) {
      if (!isValidDocument(err, document, req)) {
        res.redirect('/board/'+boardName);
        return;
      }
      
      var length = document.files.length;
      for (var i = 0; i < length; i++)  {
        deleteGridStore(document.files[i]);
      }
  
      document.remove();
      res.redirect('/board/' + boardName);
      return;
    });
  });
  

};

// Write New Document
exports.newBoard = function(req, res) {
  boardName = req.params.board;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    if (!isAuthenticated(req)) {
      res.redirect('/board/'+boardName);
      return;
    }
    res.render('board/editBoard', { document: new documentModel(), boardName: boardName, isAuthenticated: isAuthenticated(req)});
    return;
  });
  
};

// Edit Current Document
exports.editBoard = function(req, res) {
  var id
    , content;
  id = req.params.id;
  boardName = req.params.board;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    if (!isAuthenticated(req)) {
      res.redirect('/board/'+boardName);
      return;
    }
  
    documentModel(boardName).findById(id, function(err, document) {
      if (!isValidDocument(err, document, req)) {
        res.redirect('/board/'+boardName);
        return;
      }
    
      res.render('board/editBoard', {
          document       : document
        , boardName      : boardName
        , isAuthenticated: isAuthenticated(req)
      });
      return;
    });
  });
  
};

// Add New Comment
exports.commentBoard = function(req, res) {
  var id
    , conditions
    , updates
    , date;

  id        = req.params.id;
  boardName = req.params.board;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    
    if (!isAuthenticated(req)) {
      res.end('notAuthenticated');
      return;
    }
  
  
    documentModel(boardName).findById(id, function(err, document) {
  
      if (!isValidDocument(err, document)) {
        res.end('inValidDocument');
        return;
      }
  
      conditions = {'_id': id}
      date = Date.now();
      
      updates = {};
      updates.comments = document.comments;
      updates.comments.push({
          tempID : date.toString()
        , name   : req.session.user.nickname
        , content: req.body.content
        , date   : date
      });
  
      documentModel(boardName).update(conditions, updates, function(err) {
        var dateString = date.toString()
          , comment;
        for (var key in document.comments) {
          comment = document.comments[key];
          if (comment['tempID'] === dateString) {
            res.json(comment);
            return;
          }
        }
      });
    });
  });
};

// Delete Current Comment
exports.deleteCommentBoard = function (req, res) {
  var idDocument
    , idComment
    , updates
    , conditions
    , comments
    , newComments
    , length;
  
  idDocument = req.params.id;
  idComment  = req.body['idComment'];
  boardName  = req.params.board;
  
  isAvailableBoard(boardName, req, res, function(resJson) {
    if (!isAuthenticated(req)) {
      res.end('notAuthenticated');
      return;
    }
    
    documentModel(boardName).findById(idDocument, function(err, document) {
      if (!isValidDocument(err, document)) {
        res.end('inValidDocument');
        return;
      }
      
      comments = document.comments;
      length = comments.length;
      newComments = [];
      for (var i = 0; i < length; i++) {
        if (comments[i]._id == idComment) {
          if (comments[i].name != req.session.user.nickname) {
            newComments.push(comments[i]);
          } 
        } else {
          newComments.push(comments[i]);
        }
      }
      updates = { comments: newComments };
      conditions = {'_id': idDocument};
      documentModel(boardName).update(conditions, updates, function(err) {
        res.end('success');
        return;
      });
    });
  });
};

// Get Document File
exports.getBoardFile = function(req, res) {
  var id
    , name
    , fileName
    , buffer;
  id        = req.query.id
  name      = req.query.name;
  boardName = req.query.boardName;
  fileName  = name;

  isAvailableBoard(boardName, req, res, function(resJson) {
    documentModel(boardName).findById(id, function(err, document) {
      if (!isValidDocument(err, document)) {
        res.redirect('/board/'+boardName);
        return;
      }
  
      var dataLength;
      dataLength = document.files.length;
      for (var i = 0; i < dataLength; i++) {
        if (document.files[i] == name) {
  
          //buffer = new Buffer(document.files[i].data, 'base64');
          readGridStore(name, function (result, buffer) {
            res.writeHead(200, {'Content-Disposition':'attachment; filename=' + name.replace(document._id, '')});
            res.write(buffer, 'binary');
            res.end();
            return;
          });
          break;
        }
      }
    });
  });
};

exports.checkBoard = function (req, res) {
  boardName = req.params.board;
  isAvailableBoard(boardName, req, function(resJson) {
    res.json(resJson); 
  });
}