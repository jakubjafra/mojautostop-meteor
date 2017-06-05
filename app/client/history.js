Template.NavAside.events({
	'click a': function(event){
		event.preventDefault();

		var screenWidth = parseInt($(window).width());
		var scrollPane = $("div.articles").children().length * screenWidth;
		var currentScrollPos = parseInt($('body').scrollLeft());
		var currentViewedArticle = Math.round(currentScrollPos / screenWidth);
		var nextDesiredPos = (currentViewedArticle + 1) * screenWidth;

		$('body').animate({
			scrollLeft: nextDesiredPos + "px"
		}, 500);
	}
});