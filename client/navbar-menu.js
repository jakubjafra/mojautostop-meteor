/*

navbar-menu.js

*/

Template.NavbarMenu.helpers({
	'isDev': function(){
		return __isDev();
	}
});

Template._loginButtonsLoggedInDropdown.helpers({
	'useEmail': function(){
		return Meteor.user().profile.firstName.length === 0 && Meteor.user().profile.lastName.length === 0;
	}
});

Template._loginButtonsLoggedOutDropdown_CUSTOM.replaces("_loginButtonsLoggedOutDropdown");
Template._loginButtonsLoggedInDropdown_CUSTOM.replaces("_loginButtonsLoggedInDropdown");

// ~~~

Template.ProfileEdit.onCreated(function(){
	addUploaderEndPoint("profile_picture", function(url){
		Meteor.call("ChangeProfilePicture", url);
	});
});

Template.ProfileEdit.events({
	'click #edit-profile': function(){
		var modal = $("#edit-profile-modal");

		var firstName = $(modal).find("#profile-fisrtname").val();
		var lastName = $(modal).find("#profile-lastname").val();
		var specialNick = $(modal).find("#profile-nick").val();
		var specialUrl = $(modal).find("#profile-url").val();

		Meteor.call("ChangeProfileData", firstName, lastName, specialNick, specialUrl);
	}
});