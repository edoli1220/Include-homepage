function initGrayscale() {
		// Fade in images so there isn't a color "pop" document load and then on window load
		$("div#slide-gallery img").fadeIn(500);
		
		// clone image
		var i = 0;
		$('div#slide-gallery img').each(function(){
			var el = $(this);
			el.css({"position":"absolute"})
			.wrap("<div class='image_wrapper' id=wrapper_" + $(this).attr('id') + " style='position:absolute;float: left;'>")
			.clone().addClass('img_grayscale').css({"position":"absolute","z-index":i*30+30,"opacity":"0"}).insertBefore(el).queue(function(){
				var el = $(this);
				el.parent().css({"width":this.width,"height":this.height});
				el.dequeue();
			});
			this.src = grayscale(this.src);
			$(this).css("z-index",i*30+15);
			i++;
		});
		
		// Fade image 
		$('div#slide-gallery img').mouseover(function(){
			$(this).animate({opacity:1}, 500);
		})
		$('div#slide-gallery .img_grayscale').mouseout(function(){
			$(this).stop().animate({opacity:0}, 500);
		});		
}
	
	// Grayscale w canvas method
	function grayscale(src){
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		var imgObj = new Image();
		imgObj.src = src;
		canvas.width = imgObj.width;
		canvas.height = imgObj.height; 
		ctx.drawImage(imgObj, 0, 0); 
		var imgPixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
		for(var y = 0; y < imgPixels.height; y++){
			for(var x = 0; x < imgPixels.width; x++){
				var i = (y * 4) * imgPixels.width + x * 4;
				var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
				imgPixels.data[i] = avg; 
				imgPixels.data[i + 1] = avg; 
				imgPixels.data[i + 2] = avg;
			}
		}
		ctx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
		return canvas.toDataURL();
    }