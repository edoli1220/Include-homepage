var mongoose
  , GridStore
  , Schema
  , nativeDB;
  

mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/includetest', function(err) {
});


var conn = mongoose.createConnection();
conn.open('localhost', 'includetest', 27017, function (){
  nativeDB = conn.db;
  GridStore = mongoose.mongo.GridStore;
});


Schema = mongoose.Schema;

exports.DocumentModel = function(boardName) {
  var boardSchema
    , boardModel;
  boardSchema = new Schema({
      id      : {type: Number, unique: true}
    , title   : {type: String, index: true}
    , content : {type: String, index: true}
    , writer  : {type: String, index: true}
    , date    : {type: Date  , index: true}
    , files   : [String]
    , comments: [new Schema({
        tempID : String
      , writer : String
      , content: String
      , date   : {type: Date}
    })]
  });
  boardModel = mongoose.model('Document-'+boardName, boardSchema);
  return boardModel;
};

exports.AvailableBoard = function() {
  var schema = new Schema ({
      boardName: {type: String, unique: true}
    , auth: Boolean
  });
  return mongoose.model('Available-Boards', schema);
}

exports.UserModel = function() {
  var userSchema
    , userModel;
  userSchema = new Schema({
      userID  : {type: String, unique: true}
    , nickname: {type: String, unique: true}
    , password: String
    , email   : String
  });
  userModel = mongoose.model('User', userSchema);
  return userModel;
};

var saveGridStore = exports.saveGridStore = function(fileName, buffer, callback) {
  checkGridStore(fileName, function(result) {
    if (result) {
      fileName = fileName + '_';
      saveGridStore(fileName, callback);
    } else {
      var gs = new GridStore(nativeDB, fileName, 'w', {
        'chunk_size': 1024 * 1024 * 4  
      });
      gs.open(function(err, gs) {
        gs.write(buffer, function(err, gs) {
          gs.close(function(err, result) {
            if (callback) {
              callback(err, result, fileName);
            }
          });
        });
      });
    }
  });
};

var checkGridStore = exports.checkGridStore = function(fileName, callback) {
  GridStore.exist(nativeDB, fileName, function(result) {
    if (callback) {
      callback(err, result);
    }
  });
}

exports.readGridStore = function(fileName, callback) {
  var gs = GridStore(nativeDB, fileName, 'r');
  gs.open(function(err, gs) {
    console.log(gs);
    gs.seek(0, function() {
      gs.read(function(err, buffer) {
        //var buffer = new Buffer(data, 'base64');
        gs.close(function(err, result) {
          if (callback) {
            callback(err, result, buffer);
          }
        });
      });
    });
  });
};

exports.streamGridStore = function(fileName) {
  GridStore(nativeDB, fileName, 'r').open(function(err, gs) {
    return gs.stream(true);
  });
};

exports.deleteGridStore = function(fileName, callback) {
  //console.log(fileName);
  GridStore.unlink(nativeDB, fileName, function() {
    
  });
}