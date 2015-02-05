/*

client.js

*/

(function(){
	var map = null;

	Template.EditTrip.rendered = function(){
		var mapOptions = {
			// zoom: 7,
			// center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true
		};

		map = new google.maps.Map(
			document.getElementById('map-canvas'),
			mapOptions
		);

		if(Trips.findOne({}).points.length >= 2){
			

			var directionsService = new google.maps.DirectionsService();

			function makeRequest(directionDisplay, requestObject){
				return function(){
					directionsService.route(requestObject, function(response, status){
						console.log('generating route (' + status + '):');
						console.log(response);

						if(status == google.maps.DirectionsStatus.OK)
							directionDisplay.setDirections(response);
					});
				}
			}

			var directionsDisplays = [];

			var maxPointsAtRequest = 10;
			var points = Trips.findOne({}).points;

			var requests = [];

			for(var i = 0; i < points.length; i++){
				var pointsOffset = Math.floor(i / maxPointsAtRequest);
				var offsetPos = (i % maxPointsAtRequest);

				var isOrigin = (offsetPos == 0);
				var isDestination = (offsetPos == 9 || i == (points.length - 1));

				if(isOrigin){
					requests[pointsOffset] = {};
					requests[pointsOffset].travelMode = google.maps.TravelMode.DRIVING;
					requests[pointsOffset].waypoints = [];

					if(i == 0){
						requests[pointsOffset].origin = points[i].name;
					} else{
						requests[pointsOffset].origin = points[i-1].name;
						requests[pointsOffset].waypoints.push({
							location: points[i].name,
							stopover: true
						});
					}
				} else if(isDestination){
					requests[pointsOffset].destination = points[i].name;
				} else {
					requests[pointsOffset].waypoints.push({
						location: points[i].name,
						stopover: true
					});
				}
			}

			for(var i = 0; i < requests.length; i++){
				var display = new google.maps.DirectionsRenderer({
					markerOptions: {
						visible: false
					}
				});

				directionsDisplays.push(display);

				display.setMap(map);
				Meteor.setTimeout(makeRequest(display, requests[i]), i * 500);
			}
		}
	};

	Template.EditTrip.helpers({});

	Template.EditTrip.events({
		'change #new-route-input': function(event){
			HTTP.get(
				"http://nominatim.openstreetmap.org/search?format=json&q=" + $(event.currentTarget).val(),
				(function(error, response){
					if(response.data.length > 0){
						var bestResult = response.data[0];
						Meteor.call('NewRoutePoint', this._id,  new RoutePoint(
							bestResult.display_name,
							bestResult.lat,
							bestResult.lon
						));
					}
				}).bind(this)
			);

			$(event.currentTarget).val("");
		}
	})
})();

(function(){
	Template.NewTripModal.events({
		'click #new-trip': function(){
			var name = $("#new-trip-form .trip-name").val();
			Meteor.call('NewTrip', name, function(error, result){
				Router.go('edit-trip', { _id: result });
			});
		}
	});
})();

(function(){
	Template.Dashboard.events({
		'click .trip-add-new a': function(){
			$('#new-trip-modal').modal('show');
		}
	});

	Template.Dashboard.helpers({
		'mineTrips': function(){
			return Trips.find({ user: Meteor.userId() });
		}
	})
})();

Meteor.startup(function(){
	// ...
});