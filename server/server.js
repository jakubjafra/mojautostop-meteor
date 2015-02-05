/*

server.js

*/

Meteor.methods({
	'NewTrip': function(name){
		if(Meteor.userId() !== null){
			return Trips.insert(new Trip(name, Meteor.userId()));
		}
	},
	'NewRoutePoint': function(tripId, point){
		console.log(tripId);
		console.log(point);
		Trips.update(tripId, {
			$push: { points: point }
		});
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