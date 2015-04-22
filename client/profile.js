Template.Profile.helpers({
	'mineTrips': function(){
		return PublishedTrips.find({});
	},
	'userProfileData': function(){
		return Meteor.users.findOne(Books.findOne().userId);
	}
});