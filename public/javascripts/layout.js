$.urlParam = function(name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return (results &&results[1]) || 0;
} 
 
$(document).ready(function() {
  var board
    , type
    , max
  
  board = $.urlParam('board');
  if (board) {
    type = $.urlParam('type');
    if (type == 0) {
      popup(board + ' 게시판이 존재하지 않습니다.', function() {
        popdown();
        window.location.href = '/'
      });
    } else if (type == 1) {
      popup(board + ' 게시판에 들어가기 위해서는 로그인이 필요합니다.', function() {
        popdown();
        window.location.href = '/'
      });
    }
  }
  
  max = 0;
  $('label').each(function() {
    if ($(this).width() > max)
      max = $(this).width();
  });
  $('label').width(max);
  $('div.verticalCenter').each(function() {
    setCenter($(this));
  });
  

  setCenter($('div#popup'));
  $('div#popup').css('position','fixed');
  
  $(".textShadow").textShadow();
});

$(window).load(function() {
  var innerWidth
    , content;
  
  content = $('.content');
  innerWidth = content.innerWidth() - 2 * (content.css ? parseInt(content.css('padding')) : 0);
  $('.content').find('img').each(function() {
    var divCaption
      , img = $(this);
    if (img.width() > 836) {
      img.width(836);  
    }
    
    img.wrap('<div class="imgWrap" style="height:' + img.height()  +'px;width:' + img.width() + 'px"><a href="' + img.attr('src') + '" rel="lightbox[group]" title="' + img.attr('title') + '" /><div/>');
    img.after('<div class="imgCaption" style="width:' + img.width() + 'px">' + img.attr('title') + '</div>');
    divCaption = img.next();
    img.hover(function () {
      divCaption.animate({
        'margin-top': '-64px'
      }, 300)
    }, function () {
      divCaption.animate({
        'margin-top': '0'
      }, 300)
    });
    img.addClass('lightbox');
    
  });
});

google.load( "webfont", "1" );
 google.setOnLoadCallback(function() {
  WebFont.load({ custom: {
   families: [ "NanumGothicBold" ],
   urls: [ "http://fontface.kr/NanumGothicBold/css" ]
  }});
 });

function setCenter(component) {
  var top, left, div;
  div = component;
  div.css('position', 'absolute');
  top = ($(window).height() - div.height()) / 2 - 64;
  left = ($(window).width() - div.width()) / 2;
  div.css({
    top: top
    , left: left
  });
}

var isPopup = false;

function popup() {
  var message
    , type
    , callback;
  if (isPopup) {
    return;
  }
  isPopup = true;
  if (arguments.length == 2) {
    message  = arguments[0];
    callback = arguments[1];
  } else if (arguments.length == 3) {
    message  = arguments[0];
    type     = arguments[1];
    callback = arguments[2];
  }
  
  if (type && type == 1) {
    $('button#popupYes').text('확인');
    $('button#popupNo').show().text('취소');
    $('button#popupNo').css('display','inline-block');
  } else {
    $('button#popupYes').text('확인');
    $('button#popupNo').hide();
  }
  
  $('div#cover').show();
  //$('div#cover').css('height', $('body').height());
  $('div#cover').animate({
    opacity: 0.7
  }, 500, function() {

  });

  $('span#popupMessage').text(message);
  $('div#popup').show();
  $('div#popup').animate({
    opacity: 1
  }, 500, function() {

  });
  
  $('button#popupYes').unbind();
  $('button#popupNo').unbind();
  
  $('button#popupYes').click(function() {
    if (callback) {
      callback(true);
    }
  });
  $('button#popupNo').click(function() {
    if (callback) {
      callback(false);
    }
  });
}

function popdown(callback) {
  //$('div#cover').css('height', $('body').height());

  $('div#cover').animate({
    opacity: 0
  }, 500, function() {
    $('div#cover').hide();

  });

  $('div#popup').animate({
    opacity: 0
  }, 500, function() {
    $('div#popup').hide();
  });
  isPopup = false;
  if (callback) {
    callback(true);
  }
}

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

var checkBoard = function(boardName) {
    $.get('/board/check/' + boardName, function(data) {
      if (data.isAvailable) {
        location.href = '/board/' + boardName;
      } else {
        if (data.type == 0) {
          popup(boardName + ' 게시판이 존재하지 않습니다.', function() {
            popdown();
          });
        } else if (data.type == 1) {
          popup(boardName + ' 게시판에 들어가기 위해서는 로그인이 필요합니다.', function() {
            popdown();
          });
        }
      }
    }); 
}
$(document).ready(function(){
  $(".shadow-me").textShadow("#000",1,1);
});

