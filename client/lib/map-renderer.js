RouteMapRenderer = function(){
	// zmienne:
	var map = null;
	var directionsDisplays = [];

	return {
		getGoogleMap: function(){
			return map;
		},
		initIn: function(mapContainerId, options){
			// inicjalizacja samej mapy:

			map = new google.maps.Map(
				document.getElementById(mapContainerId),
				options
			);

			directionsDisplays = [];
		},
		pushRoute: function(trip, showPoints, processPoints){
			directionsDisplays.forEach(function(display){
				display.setMap(null);
			});

			directionsDisplays = [];

			if(trip.points.length >= 2){
				var points = trip.points;
				var k = 0;

				var directionsService = new google.maps.DirectionsService();
				function makeRequest(directionDisplay, requestObject){
					return function(){
						directionsService.route(requestObject, function(response, status){
							if(status == google.maps.DirectionsStatus.OK){
								directionDisplay.setDirections(response);

								function addPoint(leg_loc, point){
									if(!showPoints)
										return;

									function getMarkerNameForPoint(point_){
										return {
											url: '/' + point_.type + '_marker.png',
											size: new google.maps.Size(32, 41),
											origin: new google.maps.Point(0, 0),
											anchor: new google.maps.Point(16, 41)
										};
									}

									var point__ = new google.maps.Marker({
										position: leg_loc,
										title: "test",
										icon: getMarkerNameForPoint(point)
									});

									point__.setMap(map);
									directionsDisplays.push(point__);

									google.maps.event.addListener(point__, 'click', function() {
										editPointId.set(this.id);
										$("#edit-point-modal").modal('show');
									});
								}

								function processRoute(point, leg){
									if(processPoints){
										var dirs = leg.steps.map(function(item){
											var ret = {};

											ret.distance = item.distance.value;
											
											ret.coordsBegin = {
												lat: item.start_location.lat(),
												lng: item.start_location.lng()
											};
											
											ret.coordsEnd = {
												lat: item.end_location.lat(),
												lng: item.end_location.lng()
											};

											return ret;
										});

										Meteor.call('AddTripRouteDirections', trip._id, point.id, dirs);
									}
								}

								function processLeg(leg, point){
									addPoint(leg.end_location, point);
								}

								for(var i = 0; i < response.routes[0].legs.length; i++, k++){
									var point = points[k];

									if(i == 0){
										addPoint(response.routes[0].legs[i].start_location, point);
										
										k++;
										point = points[k];
									}

									processLeg(response.routes[0].legs[i], point);
									processRoute(points[k - 1], response.routes[0].legs[i]);
								}
							}
						});
					}
				}

				var maxPointsAtRequest = 10;

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

							if(!isDestination){
								requests[pointsOffset].waypoints.push({
									location: points[i].name,
									stopover: true
								});
							} else{
								requests[pointsOffset].destination = points[i].name;
							}
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
		}
	};
};