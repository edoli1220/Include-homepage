# Author: Daniel Jeon
# Date: 12. 8. 25

# Module
fs    = require 'fs'
util  = require 'util'
async = require 'async'
model = require './models'

documentModel   = model.DocumentModel
availableBoards = model.AvailableBoard
gridStore       = model.saveGridStore
deleteGridStore = model.deleteGridStore
readGridStore   = model.readGridStore

# Check if user is authenticated
isAuthenticated = (req, callback) ->
  if req.session and req.session.user
    callback null
    return
  else 
    callback new Error("Not authenticated")
  

# Check is Document exist
# Check user is Documnet writer
isValidDocument = (document, callback) ->
  if !document
    callback new Error("Invalid document"), document
    return
  callback null, document

isValidUser = (document, req, callback) ->
  isAuthenticated req, (err) ->
    if err
      callback err, document
      return
    if document.writer != req.session.user.nickname
      callback new Error("Invalid user"), document
      return
    callback null, document

isValidBoard = (boardName, req, callback) ->
  availableBoards().findOne
    boardName: boardName
  , (err, board) ->
      if !board
        callback "Invalid board"
        return
      if board.auth
        isAuthenticated req (err) ->
          callback err
          return
      callback err

# Check if board exist before redirect to board page
exports.checkBoard = (req, res) ->
  boardName = req.params.board
  isValidBoard boardName, req, (err) ->
    if err
      res.send err
    else 
      res.send null


exports.listBoard = (req, res) ->
  index = req.query.index or 1
  boardName = req.params.board
  pages = []

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.count callback
    (count, callback) ->
      upper = count - index * 15 + 15
      lower = count - index * 15 + 1

      maxPage = parseInt(count / 15) + 1
      pages = (num for num in [maxPage..1])

      model.find null, null,
        skip: index * 15 - 15
        limit: 15
        sort :
          id: -1
      , callback
    (documents, callback) ->
      context =
        documents: documents
        boardName: boardName
        pages    : pages
      res.render 'board/listBoard', context
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/?board=' + boardName + '&type=1'

exports.readBoard = (req, res) ->
  id = req.params.id
  boardName = req.params.board

  # 머리가 아프구만응~
  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      context =
        document: document
        boardName: boardName
        user: req.session.user
      res.render 'board/readBoard', context
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/?board=' + boardName + '&type=1'
      when 'invalid document'
        res.redirect '/board/' + boardName

exports.postBoard = (req, res) ->
  boardName = req.params.board
  title = req.body.title
  content = req.body.content
  user = req.session.user

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      # 마지막 문서의 아이디를 얻기 위해 하는 뻘짓
      # 그냥 count를 구해버리면 중간에 빠진 게시글도 있을테니...
      model = documentModel boardName
      model.find null, null,
        limit: 1
        sort:
          id: -1
      , callback
    (documents, callback) ->
      document = documents[0]
      index = if document then document.id + 1 else 0

      title = if !title then '제목없음'

      data =
        id      : index
        title   : title
        writer  : user.nickname
        content : content
        date    : Date.now()
        comments: []
        files   : []

      model = documentModel boardName
      document = new model data

      parallelTasks = []
      dataFile = null
      for key, dataFile of req.files
        if dataFile.size > 0
          task = (callback) ->
            file = fs.readFile dataFile.path
            name = document._id + dataFile.name
            gridStore name, file
            document.files.push name

      async.parallel parallelTasks, (err, results) ->
        callback err, document
    (document, callback) ->
      document.save (err) ->
        # Ajax uploading 을 하기 때문에 redirect 하지 않고
        # url을 client에게 보내서 client쪽에서 
        # 완료를 확인하고 redirect
        res.end '/board/' + boardName
  ]
    
  async.waterfall tasks, (err, result) ->
    # no redirect 
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/?board=' + boardName + '&type=1'
      when 'invalid document'
        res.redirect '/board/' + boardName
      when 'invalid user'
        res.redirect '/board/' + boardName
    
exports.updateBoard = (req, res) ->
  boardName = req.params.board
  id = req.params.id
  title = req.body.title
  content = req.body.content
  user = req.session.user

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      isValidUser document, req, callback
    (document, callback) ->
      title = if !title then '제목없음'

      updates =
        title  : title
        content: content
        date   : Date.now()

      updates.files = document.files

      parallelTasks = []
      dataFile = null
      for key, dataFile of req.files
        if dataFile.size > 0
          task = (callback) ->
            file = fs.readFile dataFile.path
            name = document._id + dataFile.name
            gridStore name, file
            updates.files.push name

      async.parallel parallelTasks, (err, results) ->
        callback err, updates
    (document, callback) ->
      condition =
        _id: id
      model = documentModel boardName
      model.update condition, updates, (err) ->
        res.end '/board/' + boardName 
  ]
    
  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/?board=' + boardName + '&type=1'
      when 'invalid document'
        res.redirect '/board/' + boardName
      when 'invalid user'
        res.redirect '/board/' + boardName

exports.deleteBoard = (req, res) ->
  boardName = req.params.board
  id = req.params.id

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      isValidUser document, req, callback
    (document, callback) ->
      for file in document.files
        deleteGridStore file

      document.remove()
      res.redirect '/board/' + boardName
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/?board=' + boardName + '&type=1'
      when 'invalid document'
        res.redirect '/board/' + boardName
      when 'invalid user'
        res.redirect '/board/' + boardName

exports.newBoard = (req, res) ->
  boardName = req.params.board

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      isAuthenticated req, callback
    (callback) ->
      model = documentModel()
      context =
        document : model
        boardName: boardName
      res.render 'board/editBoard', context
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'not authenticated'  
        res.redirect '/board/' + boardName
      when 'invalid document'
        res.redirect '/board/' + boardName
      when 'invalid user'
        res.redirect '/board/' + boardName

exports.editBoard = (req, res) ->
  id = req.params.id
  boardName = req.params.board

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      isValidUser document, req, callback
    (document, callback) ->
      context =
        document : document
        boardName: boardName
      res.render 'board/editBoard', context
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid board' 
        res.redirect '/?board=' + boardName + '&type=0'
      when 'no authenticated'  
        res.redirect '/board/' + boardName
      when 'invalid document'
        res.redirect '/board/' + boardName
      when 'invalid user'
        res.redirect '/board/' + boardName

exports.postComment = (req, res) ->
  id = req.params.id
  boardName = req.params.board
  comment = {}

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      isAuthenticated req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      comment =
        writer : req.session.user.nickname
        content: req.body.content
        date   : Date.now()

      comments = document.comments
      comments.push comment
      updates =
        comments: comments

      condition =
        _id: id

      model = documentModel boardName
      model.update condition, updates, callback
    (callback) ->
      res.json comment
  ]

  async.waterfall tasks, (err, result) ->
    if err
      res.end err

exports.deleteComment = (req, res) ->
  id = req.params.id
  boardName = req.params.board
  idComment = req.body.idComment

  tasks = [
    (callback) ->
      isAuthenticated req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      comments = []
      for comment in document.comments
        if not(comment._id.toString() is idComment and comment.writer is req.session.user.nickname)
          comments.push comment
      updates =
        comments: comments
      condition =
        _id: id

      model = documentModel boardName
      model.update condition, updates, callback
    (callback) ->
      res.end 'success'
  ]

  async.waterfall tasks, (err, result) ->
    res.end err

# 이름으로 검색
exports.getBoardFile = (req, res) ->
  id = req.query.id
  boardName = req.query.boardName
  fileName = req.query.name
  idDocument = ''

  tasks = [
    (callback) ->
      isValidBoard boardName, req, callback
    (callback) ->
      model = documentModel boardName
      model.findById id, callback
    (document, callback) ->
      isValidDocument document, callback
    (document, callback) ->
      idDocument = document._id
      readGridStore fileName, callback
    (result, buffer, callback) ->
      res.attachment fileName.replace idDocument, ''
      res.write buffer, 'binary'
      res.end()
  ]

  async.waterfall tasks, (err, result) ->
    switch err
      when 'invalid document'
        res.redirect '/board/' + boardName
    res.end()



