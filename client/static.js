/*

static.js

*/

var current = new ReactiveVar({
	x: 0,
	y: 0
});

function getNewXForDirection(direction){
	switch(direction){
		case "up":
			return parseInt(current.get().x);

		case "down":
			return parseInt(current.get().x);

		case "left":
			return parseInt(current.get().x) - 1;

		case "right":
			return parseInt(current.get().x) + 1;
	}
}

function getNewYForDirection(direction){
	switch(direction){
		case "up":
			return parseInt(current.get().y) - 1;

		case "down":
			return parseInt(current.get().y) + 1;

		case "left":
			return parseInt(current.get().y);

		case "right":
			return parseInt(current.get().y);
	}
}

Template.NavAside.events({
	'click a': function(event){
		event.preventDefault();

		var direction = $(event.currentTarget).data('direction');

		var newX = getNewXForDirection(direction);
		var newY = getNewYForDirection(direction);

		current.set({
			x: newX,
			y: newY
		});

		var target = $("#pos_" + newX + "_" + newY);
		if(target.length > 0) {
			$('html,body').animate({
				scrollTop: target.offset().top,
				scrollLeft: target.offset().left
			}, 500);
		}
	}
});