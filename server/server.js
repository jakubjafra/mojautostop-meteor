/*

server.js

*/

function bindRoutesToPoints(points){
	if(points.length >= 2){
		for(var i = 0; i < points.length; i++){
			var nextRoutePointId = null;
			if(points[i + 1] != undefined)
				nextRoutePointId = points[i + 1].id;

			points[i].route = new Route(points[i].id, nextRoutePointId);
		}
	}
}

function getCountryCodeForPoint(coords){
	var lat = coords.k || coords.lat || undefined;
	var lon = coords.C || coords.lon || undefined;

	var ret = HTTP.get("http://nominatim.openstreetmap.org/reverse?format=json&zoom=0&lat=" + lat + "&lon=" + lon);

	return ret.data.address.country_code;
}

Meteor.methods({
	'NewTrip': function(){
		if(Meteor.userId() !== null){
			return Trips.insert(new Trip("Nienazwany trip", Meteor.userId()));
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

		bindRoutesToPoints(newPoints);

		if(newPoints.length > points.length){
			console.log("Added new point after #" + insertAfter + " to trip #" + tripId);

			Trips.update(tripId, {
				$set: { points: newPoints }
			});
		}
		else{
			console.log("[ERR] Tried to add new point after #" + insertAfter + " to trip #" + tripId);
			console.log(newPoint);
		}
	},
	'RemoveRoutePoint': function(tripId, pointId){
		var points = Trips.findOne(tripId).points;

		var newPoints = points.filter(function(curr){
			return !(curr.id === pointId);
		});

		bindRoutesToPoints(newPoints);

		Trips.update(tripId, {
			$set: { points: newPoints }
		});

		console.log("Removed point #" + pointId + " from trip #" + tripId);
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
	},
	'ChangeTripName': function(tripId, newTripName){
		Trips.update(tripId, {
			$set: { name: newTripName }
		});

		console.log("Renamed #" + tripId + " to \"" + newTripName + "\"");
	},
	'AddTripRouteDirections': function(tripId, pointId, directions){
		var newPoints = Trips.findOne(tripId).points;

		for(var i = 0; i < newPoints.length; i++){
			if(newPoints[i].id === pointId){
				newPoints[i].route.gmap_directions = directions;
				break;
			}
		}

		Trips.update(tripId, {
			$set: { points: newPoints }
		});
	},

	// ~~~

	'i_GeneratePerCountryStats': function(){
		var trips = Trips.find({}).fetch();

		trips.forEach(function(trip){
			trip.points = trip.points.map(function(point){
				if(point.route.endId !== null && point.route.gmap_directions.length > 0){
					var dist = point.route.gmap_directions.reduce(function(prev, curr){
						return prev + (curr.distance / 1000);
					}, 0);

					point.route.stats.distance = dist;

					// ~~~

					var begin = point.route.gmap_directions[0].coordsBegin;
					var end = point.route.gmap_directions[point.route.gmap_directions.length - 1].coordsEnd;

					var countryBegin = getCountryCodeForPoint(begin);
					var countryEnd = getCountryCodeForPoint(end);
					if(countryBegin === countryEnd){
						// prosta sprawa...
						point.route.stats.countries.push({
							countryCode: countryBegin,
							distance: dist
						});
					} else {
						// już trochę trudniej...
						var countryStats = {};
						var lastCountry = countryBegin;

						for(var i = 0; i < point.route.gmap_directions.length; i++){
							var countryBegin = getCountryCodeForPoint(point.route.gmap_directions[i].coordsBegin);
							var countryEnd = getCountryCodeForPoint(point.route.gmap_directions[i].coordsEnd);

							if(countryBegin === countryEnd){
								if(countryStats[countryBegin] == undefined)
									countryStats[countryBegin] = 0;

								countryStats[countryBegin] += point.route.gmap_directions[i].distance;
							}
							else {
								if(countryStats[countryBegin] == undefined)
									countryStats[countryBegin] = 0;

								if(countryStats[countryEnd] == undefined)
									countryStats[countryEnd] = 0;

								countryStats[countryBegin] += Math.floor(point.route.gmap_directions[i].distance / 2);
								countryStats[countryEnd] += Math.floor(point.route.gmap_directions[i].distance / 2);
							}
						}

						point.route.stats.countries = [];
						for(var country in countryStats){
							point.route.stats.countries.push({
								countryCode: country,
								distance: countryStats[country]
							});
						}
					}
				}

				return point;
			});

			trip.stats.distance = trip.points.reduce(function(prev, point){
				return prev + point.route.stats.distance;
			}, 0);

			Trips.update(trip._id, trip);
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