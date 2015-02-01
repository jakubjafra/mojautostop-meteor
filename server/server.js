/*

server.js

*/

Meteor.methods({
	'NewTrip': function(name){
		if(Meteor.userId() !== null)
			return Trips.insert({ name: name, user: Meteor.userId() });
	}
});

Meteor.startup(function(){
	Meteor.publish("get-trip-data", function(tripId){
		return Trips.find({_id: tripId});
	});

	Meteor.publish("mine-trips", function(){
		if(this.userId !== null)
			return Trips.find({ user: this.userId });
	});
});