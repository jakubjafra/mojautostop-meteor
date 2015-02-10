/*

server.js

*/

Meteor.methods({
	'NewTrip': function(name){
		if(Meteor.userId() !== null){
			return Trips.insert(new Trip(name, Meteor.userId()));
		}
	},
	'NewRoutePoint': function(tripId, insertAfter, newPoint){
		var points = Trips.findOne(tripId).points;

		var newPoints = [];

		if(insertAfter == null)
			newPoints.push(newPoint);

		for(var i = 0; i < points.length; i++){
			var currPoint = points[i];

			newPoints.push(currPoint);
			if(insertAfter != null && currPoint.id == insertAfter)
				newPoints.push(newPoint);
		}

		if(newPoints.length > points.length){
			console.log("Added new point after #" + insertAfter + " to trip #" + tripId);

			Trips.update(tripId, {
				$set: { points: newPoints }
			});
		}
		else{
			console.log("Tried to add new point after #" + insertAfter + " to trip #" + tripId);
			console.log(newPoint);
		}
	},
	'RemoveRoutePoint': function(tripId, pointId){
		var points = Trips.findOne(tripId).points;

		var newPoints = points.filter(function(curr){
			return !(curr.id === pointId);
		});

		console.log("Removed point #" + pointId + " from trip #" + tripId);

		Trips.update(tripId, {
			$set: { points: newPoints }
		});
	},
	'EditRoutePoint': function(tripId, pointId, newPoint){
		newPoint.id = pointId;

		var newPoints = Trips.findOne(tripId).points.map(function(curr){
			if(curr.id == pointId)
				return newPoint;
			else
				return curr;
		});

		console.log("Replaced point #" + pointId + " to new version from trip #" + tripId);

		Trips.update(tripId, {
			$set: { points: newPoints }
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