/*

static.js

*/

/*
Template.ArticleAside.events({
	'click .glyphicon': function(event){
		switch(this.direction){
			case "up":
				break;

			case "down":
				break;

			case "left":
				break;

			case "right":
				break;
		}
	}
});
*/

Template.ArticleAside.events({
	'click a': function(event){
		event.preventDefault();

		var hash = $(event.currentTarget).attr('href');
		var target = $(hash);
	      if (target.length) {
	        $('html,body').animate({
	          scrollTop: target.offset().top,
	          scrollLeft: target.offset().left
	        }, 500);
	      }

	    return false;
	}
})

Template.ArticleAside.helpers({
	'newX': function(){
		switch(this.direction){
			case "up":
				return parseInt(this.parent.x);

			case "down":
				return parseInt(this.parent.x);

			case "left":
				return parseInt(this.parent.x) - 1;

			case "right":
				return parseInt(this.parent.x) + 1;
		}
	},
	'newY': function(){
		switch(this.direction){
			case "up":
				return parseInt(this.parent.y) - 1;

			case "down":
				return parseInt(this.parent.y) + 1;

			case "left":
				return parseInt(this.parent.y);

			case "right":
				return parseInt(this.parent.y);
		}
	}
})