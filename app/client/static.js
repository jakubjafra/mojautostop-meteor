/*
Template.StaticPage.onRendered(function(){
	// change opacity on scroll down
	$(window).scroll(function(event){
		var fullOpacityDistance = parseInt($(window).height());
		var step = 0.75 + 0.15 * ($(window).scrollTop() / fullOpacityDistance);
		$("nav.navbar").css("background-color", "rgba(255, 255, 255, " + step + ")");
	});
});
*/

/*
function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}
*/

Template.StaticPage.helpers({
	'isDev': function(){
		return __isDev();
	}
});

Template.StaticPage.events({
	'click #register-button': function(event){
		Template.instance().$("#signup-link").click();
	}
	// 'click #newsletter-submit': function(event){
	// 	var email = $("#newsletter-email").val();

	// 	$("#newsletter-email, #newsletter-submit").attr('disabled', true);

	// 	Meteor.call('RegisterToNewsletter', email, function(){
	// 		$("#newsletter-submit")
	// 			.addClass("btn-success")
	// 			.removeClass("btn-primary")
	// 			.html('<span class="glyphicon glyphicon-ok"></span>');
	// 	});
	// }
	/*,
	'keydown #newsletter-email': function(event){
		if(!validateEmail($(event.currentTarget).val())){
			$(event.currentTarget).parent().addClass("has-error");
			$("#newsletter-submit").attr("disabled", true);
		}
		else{
			$(event.currentTarget).parent().removeClass("has-error");
			$("#newsletter-submit").attr("disabled", false);
		}
	}
	*/
});

function scrollPageByElement(element){
	var scrollTarget = $(element);
	$("html, body").animate({
		scrollTop: (scrollTarget.offset().top - (($(window).height() / 2) - $("nav.navbar").height() - ($(scrollTarget).height() / 2)))
	}, 500);
}

Template.NavAsideDown.events({
	'click span': function(event){
		scrollPageByElement($(event.currentTarget).data('scrollTarget'));
	}
});

Template.StaticPage.events({
	'click header a': function(event){
		scrollPageByElement($(event.currentTarget).data('scrollTarget'));
	}
});