var thumbid
  , thumbs
  , ballonTexts;

function fick(id) {  
	for (var i=0; i < 5; i++) {
		if(i > id){
			thumbs[i].animate({ left:i*140 + 280,}, 100, "linear", function() { } );
		} else if(i == id) {
			if (id == 0) {
				thumbs[i].animate({ left:0,}, 100, "linear", function() { } );
			} else {
				thumbs[i].animate({ left:i*140, }, 100, "linear", function() { } );
			}
		} else if(i == 0) {
			thumbs[i].animate({ left:0,}, 100, "linear", function() { } );
		} else {
			thumbs[i].animate({ left:i*140}, 100, "linear", function() { } );
		}
	};
}

function initGallery(thuid) {
  thumbid = thuid;
	thumbs = new Array(5);
	for (var i=0; i < 5; i++) {
		thumbs[i] = $(thumbid+i);
	}
  ballonTexts=[];
  ballonTexts[0] = '동아리 내 5:5 lol 대전';
  ballonTexts[1] = '스포츠 컴플렉스 옆에 붙여진 포스터들';
  ballonTexts[2] = '2012 신입생 모집 포스터';
  ballonTexts[3] = '2012 카이스트 축제앱 개발';
  
  thumbs[0].hover(function() {fick(0);mouseoversound3.playclip();balloon.show();balloonText.text(ballonTexts[0]);}, function(){balloon.hide()});
  thumbs[1].hover(function() {fick(1);mouseoversound3.playclip();balloon.show();balloonText.text(ballonTexts[1]);}, function(){balloon.hide()});
  thumbs[2].hover(function() {fick(2);mouseoversound3.playclip();balloon.show();balloonText.text(ballonTexts[2]);}, function(){balloon.hide()});
  thumbs[3].hover(function() {fick(3);mouseoversound3.playclip();balloon.show();balloonText.text(ballonTexts[3]);}, function(){balloon.hide()});
}