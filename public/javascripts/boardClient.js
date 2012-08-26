var rFilter = /^(image\/bmp|image\/gif|image\/jpg|image\/jpeg|image\/png)$/i;  

$(window).load(function() {
  boardLoad();
  
  $('#newCommentContent').bind('keypress', function(e) {
    if (e.keyCode == 10 && e.ctrlKey) {
      $('#submitComment').click();
    }
  });
});

var divDataDrop = {};
var divComments = {};
var boardLoad = function () {
  var divDataFileContainer
    , divDataDropField
    , divDataDropBox
    , ulDataFileList
    , divCommentContainer
    , ulComments;
    
  divDataFileContainer = $('div.dataFileContainer');
  divDataDropField     = divDataFileContainer.find('div.dataDropField');
  divDataDropBox       = divDataFileContainer.find('div.dataDropBox');
  ulDataFileList       = divDataFileContainer.find('ul.dataFileList');
  
  if (!divDataFileContainer.length == 0) {
    divDataDropBox.height(divDataDropField.height() - 8);
    
    divDataDropField.filedrop({
      error: function (err, file) {
        switch(err) {
          case 'BrowserNotSupported':
            //do Something
            break;
          case 'TooManyFiles':
            //do Something
            break;
          case 'FileTooLarge':
            console.log("Too Large");
            //do Something
            break;
          default:
            break;
        }
      },
      maxfilesize: 1,
      dragEnter: dragenterFile,
      dragLeave: dragleaveFile,
      dragOver : dragoverFile,
      drop     : dropFile,
      uploadStarted: uploadFile
    });
    
    divDataDrop.divDataDropField = divDataDropField;
    divDataDrop.divDataDropBox   = divDataDropBox;
    divDataDrop.ulDataFileList   = ulDataFileList;
    divDataDrop.files            = [];
  }
  
  divCommentContainer = $('div.commentContainer');
  ulComments          = divCommentContainer.find('ul.comments');
  
  divComments.divCommentContainer = divCommentContainer;
  divComments.ulComments          = ulComments;
}

var deleteDocument = function (href) {
  popup('정말로 게시물을 삭제하겠습니까?', 1, function(ans) {
    if (ans == true) {
      popdown();
      window.location.href = href;
    } else {
      popdown();
    }
  });
}

var addComment = function (href) {
  var data
    , content;
  data = {};
  content = $('#newCommentContent').val()
  $('#newCommentContent').val('');
  data['content'] = content;
  $.post(href, data, function(data) {
    var listItem
      , deleteURL
      , dateString
      , date;
      
    date = data.date.toString();
    dateString = date.slice(0,4)
      + '.' + (date.slice(6,8)) 
      + '.' + (date.slice(10,12)) 
      + '  ' + date.slice(16,24);
    listItem = $('#commentListItemTemplate').clone();
    listItem.removeAttr('id');
    deleteURL = listItem.find('.commentDelete').attr('href');
    listItem.find('.commentDelete').click(function () {
      deleteComment(deleteURL, data._id, $(this))
    });
    listItem.find('.commentContent').html(data.content.split('\n').join('</br>'));
    listItem.find('.commentName').text(data.writer + ' - ' + dateString);
    
    divComments.ulComments.append(listItem);
    listItem.slideDown(300);
  });
}

var deleteComment = function (href, id, element) {
  popup('정말로 댓글을 삭제하겠습니까?', 1, function(ans) {
    if (ans == true) {
      popdown();
      $.post(href, {'idComment': id}, function(data) {
        if (!(typeof(data) == 'string')) {
          data = 'success'; 
        }
        if (data === 'success') {
          $(element).parent().animate({
             'margin-bottom': '-26px'
            , opacity: 0
          }, 300, function() {
            $(this).remove();
          });
        } else if (data === 'notAuthenticated') {
          popup('로그인을 안하셨군요.', function(ans) {
            popdown();
          });
        } else if (data === 'inValidDocument') {
          popup('없는 문서입니다.', function(ans) {
            popdown();
          });
        }
      });
    } else {
      popdown();
    }
  });
}

function dragenterFile (event) {
  divDataDrop.divDataDropBox.css('background', 'rgba(0,0,0,0.3)');
}

function dragleaveFile (event) {
  divDataDrop.divDataDropBox.css('background', '');
}

function dragoverFile (event) {
}

function dropFile (event) {
  divDataDrop.divDataDropBox.css('background', '');
}

function uploadFile (i, file, len) {
  addFile(file);
}

var onFile = function (element) {
  var file
    , length;
  length = element.files.length;
  for (var i = 0; i < length; i ++) {
    file = element.files[i];
    if (file.name) {
      addFile(file);
    }
  }
  element.files = [];
  element.value = "";
};

var addFile = function (file) {
  var newList;
  if (!file.name) {
    return
  }
  
  //divDataDrop.totalSize += file.size;
  if (file.size > 1024 * 1024 * 1024){
    //divDataDrop.totalSize -= file.size
    popup("용량이 1GB를 초과하여 등록할 수 없습니다.", function() {
      popdown();
    });
  } else {
    divDataDrop.files.push(file);
    newList = $('<li class="fileListItem"><div class="fileName">' 
      + file.name 
      + '</div><div class="fileDelete" OnClick="deleteFile(this,\''
      + file.name+ '\')"><img src="/images/delete.png" /></div></li>');
    divDataDrop.ulDataFileList.append(newList); 
    newList.fadeOut(0, function() {
      $(this).fadeIn(300);
    });
  }
};
divDataDrop.totalSize = 0;
divDataDrop.maxSize   = 16 * 1024 * 1024;

var deleteFile = function (element, fileName) {
  var file
    , files
    , length;
    
  files  = divDataDrop.files;
  length = files.length;
  for (var key in files) {
    if (files[key] && files[key].name === fileName) {
      divDataDrop.totalSize -= files[key].size;
      delete files[key]
      break;
    }
  }
  
  $(element).parent().animate({
      'margin-bottom': '-26px'
    , opacity: 0
    }, 300, function() {
    $(this).remove();
  });
};
var onError = function (err) {
  console.log(err);
};

var onProgress = function (e) {
  if (e.lengthComputable) {
    var percentComplete = (e.loaded/e.total)*100;
    console.log(percentComplete);
  }
};
var submitData = function () {
  var postURL
    , data;
  
  postURL = $('#formContent').attr('action');
  data    = new FormData();
  
  data.append('title', $('input.titleInput').val())
  data.append('content', $('textarea.contentInput').val())
  for (var i =0 ; i < divDataDrop.files.length ; i++) {
    data.append('files' + i, divDataDrop.files[i]); 
  }
  
  $.ajax({
      url: postURL
    , data: data
    , cache: false
    , contentType: false
    , processData: false
    , type: 'POST'
    , success: function(data){
        if (typeof(data)=='string') {
          window.location.href = data;
        } else {
          window.location.href = data.baseURI;
        }
      }
  });
  /*
  $.post(postURL, data, function(data) {
    console.log(data);
  });
  */
};

////=======Socket IO===============
var socket = io.connect('http://localhost:3013');
var divFileProgress
  , divFileProgressBar;

socket.on('dataProgress', function (data) {
  if (!divFileProgress) {
    divFileProgress = $('.dataFileProgress');
    divFileProgress.show();
  }
  if (!divFileProgressBar) {
    divFileProgressBar = $('.dataFileProgressBar');
  }
  divFileProgressBar.css('left', (data.progressPercent * 5.12 - 512) + 'px');
});