/*

client.js

*/

(function(){
	UI.registerHelper("valueify", function(obj){
	    result = [];
	    for (var key in obj){
	        result.push({name:key,value:obj[key]});
	    }
	    return result;
	});
})();

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
		pushRoute: function(trip, showPoints){
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
											size: new google.maps.Size(32, 32),
											origin: new google.maps.Point(0, 0),
											anchor: new google.maps.Point(16, 16)
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
									if(showPoints){
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

(function(){
	var routeId = undefined;

	var map_ = new RouteMapRenderer();

	var editPointId = new ReactiveVar(null);
	var insertAfterId = new ReactiveVar(null);

	var isRendered = false;

	var uploadedFiles = [];

	Template.EditTrip.rendered = function(){
		routeId = this._id;

		map_.initIn('map-canvas', {
			zoom: 7,
			center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP
			// disableDefaultUI: true
		});

		map_.pushRoute(Trips.findOne({}), true);

		isRendered = true;
		// makeRoute();

		$('[data-toggle="tooltip"]').tooltip();

		Uploader.finished = function(index, fileInfo, templateContext){
			uploadedFiles.push(fileInfo.url);
		};
	};

	Template.EditTrip.helpers({
		'points': function(){
			// przypadek kiedy trasa istnieje ale zostaje usunięta
			if(Trips.findOne({}) === undefined)
				Router.go('/dashboard');

			// ~~~

			if(isRendered)
				map_.pushRoute(Trips.findOne({}), true);

			var points = Trips.findOne({}).points;
			
			var i = 0;
			return points.map(function(item){
				item.index = (i++);
				item.isEnd = (i === points.length);
				return item;
			});
		},
		'pointTypeHtml': function(){
			switch(this.type){
				case "normal":
					return '<span class="badge badge-normal-iconic"><span class="glyphicon glyphicon-map-marker"></span></span>';

				case "tent":
					return '<span class="badge badge-tent-iconic"><span class="glyphicon glyphicon-flag"></span></span>';

				case "house":
					return '<span class="badge badge-house-iconic"><span class="glyphicon glyphicon-home"></span></span>';
			}
		},
		'parseInt': function(x){
			return Math.round(x);
		}
	});

	Template.EditTrip.events({
		'click .point-action-remove': function(event){
			Meteor.call('RemoveRoutePoint', Trips.findOne({})._id, this.id);
		},
		'click .point-action-edit': function(event){
			editPointId.set(this.id);

			$("#edit-point-modal").find('.trip-name').val(this.name);
		},
		'click .route-action-edit': function(event){
			editPointId.set(this.id);
		},
		'click .point-action-add': function(event){
			insertAfterId.set(this.id);
		},
		'click #new-point-button': function(event){
			var points = Trips.findOne({}).points;
			if(points.length == 0)
				insertAfterId.set(null);
			else
				insertAfterId.set(points[points.length - 1].id);
		},
		'click #name-box > .name-show': function(event){
			if(event.currentTarget === event.target){
				$("#name-box > .name-show").hide();
				$("#name-box > .name-edit").show().focus();
			}
		},
		'keyup #name-box > .name-edit': function(event){
			if(event.which == 13){
				Meteor.call('ChangeTripName', this._id, $(event.currentTarget).val());

				$("#name-box > .name-show").show();
				$("#name-box > .name-edit").hide();
			}
		}
	});

	// ~~~

	Template.AddPointModal.events({
		'click #new-point': function(event){
			var modal = $('#new-point-modal');

			// pola wymagane:
			var placeName = getValueOfTripNameSelectizeInModal(modal);
			
			// ~~~

			var routePoint = new RoutePoint(placeName);

			// pola dodatkowe:

			if(modal.find('input[name="point-type"]:checked').length == 1)
				routePoint.type = $('#new-point-modal').find('input[name="point-type"]:checked').val();

			if(	modal.find('.description-text').length == 1 &&
				modal.find('.description-text').val().length > 0)
				routePoint.desc.text = modal.find('.description-text').val();

			routePoint.desc.pictures = uploadedFiles.slice(0); // clone [ http://davidwalsh.name/javascript-clone-array ]

			var waitingTime = getPointWaitingTime(modal);
			Meteor.call('NewRoutePoint', this._id, insertAfterId.get(), routePoint, waitingTime);

			// ~~~

			$('#new-point-modal').find('.trip-name').val("");
			uploadedFiles = [];
		}
	});

	Template.AddPointModal.helpers({
		'isSelected': function(){
			return this.id == insertAfterId.get();
		},
		'atLeastOnePoint': function(){
			return Trips.findOne({}).points.length > 0;
		}
	});

	Template.AddPointModal.rendered = function(){
		pictures.set([]);
	};

	// ~~~

	Template.EditPointModal.events({
		'click #edit-point': function(event){
			var modal = $("#edit-point-modal");

			var placeName = getValueOfTripNameSelectizeInModal(modal);
			
			// ~~~

			var routePoint = getPoint(editPointId.get());

			routePoint.name = placeName;

			// pola dodatkowe:

			if(modal.find('input[name="point-type"]:checked').length == 1)
				routePoint.type = modal.find('input[name="point-type"]:checked').val();

			if(	modal.find('.description-text').length == 1 &&
				modal.find('.description-text').val().length > 0)
				routePoint.desc.text = modal.find('.description-text').val();

			routePoint.desc.pictures = routePoint.desc.pictures.concat(uploadedFiles);

			var waitingTime = getPointWaitingTime(modal);

			Meteor.call('EditRoutePoint', this._id, editPointId.get(), routePoint, waitingTime);

			// ~~~

			editPointId.set(null);
		}
	});

	Template.EditPointModal.helpers({
		'editPointId': function(){
			return editPointId.get();
		}
	});

	Template.EditPointModal.rendered = function(){
		$("#edit-point-modal").on('show.bs.modal', function(){
			var point = null;
			if((point = getPoint(editPointId.get())) === undefined)
				return;

			var modal = $("#edit-point-modal");

			modal.find('.description-text').val(point.desc.text);

			modal.find('.point-type-selector input').prop('checked', false);
			modal.find('.point-type-selector input[value="'+point.type+'"]').prop( "checked", true );

			setRouteWaitingTimeInModal(modal, point);

			initializeSelectize(modal.find('.trip-name'), point.name);

			pictures.set(point.desc.pictures);
		});
	};

	// ~~~

	function initializeSelectize(element, preApplyValue){
		var service = new google.maps.places.AutocompleteService();

		var options = {
			valueField: 'value',
			labelField: 'value',
			searchField: 'value',
			create: false,
			maxItems: 1,
			cache: false,

			render: {
				option: function(item, escape) {
					return '<div>' +
								'<span class="title">' +
									'<span class="name">' + escape(item.value) + '</span>' +
								'</span>' +
							'</div>';
				}
			},
			load: function(query, callback) {
				if(query.length > 0){
					service.getPlacePredictions({
						input: query,
						types: ["geocode"]
					}, function(predictions, status){
						if(status == google.maps.places.PlacesServiceStatus.OK){
							callback($.map(predictions, function(item){
								return { value: item.description };
							}));
						} else
							callback();
					});
				} else
					callback();
			}
		};

		if(preApplyValue !== undefined){
			options.options = [{
				value: preApplyValue
			}];

			options.items = [preApplyValue];
		}

		var $selectize = $(element).selectize(options);
	}

	function getValueOfTripNameSelectizeInModal(modal){
		var selectized = $(modal).find('.trip-name.selectize-control.single.selectized');
		return selectized[selectized.length - 1].value;
	}

	Template.ModalPointCommonContents.rendered = function(){
		initializeSelectize(".trip-name");
	};

	Template.ModalPointCommonContents.helpers({
		'atLeastOnePoint': function(){
			return Trips.findOne({}).points.length > 0;
		},
		'isNotLastPoint': function(){
			var points = Trips.findOne({}).points;
			for(var i = 0; i < points.length; i++)
				if(points[i].id === editPointId.get())
					return !(i === (points.length - 1));

			return false;
		}
	});

	// ~~~

	function getPoint(id){
		if(editPointId.get() !== null) {
			var points = Trips.findOne({}).points;
					
			for(var i = 0; i < points.length; i++)
				if(points[i].id === editPointId.get())
					return points[i];
		}

		return undefined;
	}

	var pictures = new ReactiveVar([]);

	Template.DescriptionContents.helpers({
		'atLeastOnePointPicture': function(){
			/*
			var point;
			if((point = getPoint(editPointId.get())) !== undefined)
				return point.desc.pictures.length > 0;
			else
				return false;
			*/
			return pictures.get().length > 0;
		},
		'pointPictures': function(){
			/*
			var point;
			if((point = getPoint(editPointId.get())) !== undefined)
				return point.desc.pictures;
			else
				return [];
			*/
			return pictures.get();
		}
	});

	Template.DescriptionContents.rendered = function(){
		$(".fancybox-image").fancybox();
	};

	// ~~~

	Template.PublishModal.events({
		'click #do-publish': function(){
			Meteor.call('PublishTrip', Trips.findOne({})._id);
		},
		'click #stop-publish': function(){
			Meteor.call('UnPublishTrip', Trips.findOne({})._id);
		}
	});

	// ~~~

	function setRouteWaitingTimeInModal(modal, point){
		try {
			modal.find('.point-waiting-time').val(juration.stringify(point.route.waitingTime, { format: 'micro' }));
		} catch(error){
			modal.find('.point-waiting-time').val("");
		}
	}

	Template.EditRouteModal.rendered = function(){
		$("#edit-route-modal").on('show.bs.modal', function(){
			var point = null;
			if((point = getPoint(editPointId.get())) === undefined)
				return;

			var modal = $("#edit-route-modal");
			
			setRouteWaitingTimeInModal(modal, point);

			modal.find('.description-text').val(point.route.desc.text);

			pictures.set(point.route.desc.pictures);
		});
	}

	function getPointWaitingTime(modal){
		// pola dodatkowe:
		if(	$(modal).find('input[name="point-waiting-time"]').length == 1 &&
			$(modal).find('input[name="point-waiting-time"]').val().length > 0){
			var inputValue = $(modal).find('input[name="point-waiting-time"]').val();

			try {
				return juration.parse(inputValue);
			} catch(error){
				return null;
			}
		}
	}

	Template.EditRouteModal.events({
		'click #edit-route': function(event){
			var point = null;
			if((point = getPoint(editPointId.get())) === undefined)
				return;

			var route = point.route;

			// pola dodatkowe:
			route.waitingTime = getPointWaitingTime($('#edit-route-modal'));

			if(	$('#edit-route-modal').find('.description-text').length == 1 &&
				$('#edit-route-modal').find('.description-text').val().length > 0)
				route.desc.text = $('#edit-route-modal').find('.description-text').val();

			route.desc.pictures = uploadedFiles.slice(0); // clone [ http://davidwalsh.name/javascript-clone-array ]

			Meteor.call('EditRoute', this._id, point.id, route);

			// ~~~

			$('#edit-route-modal').find('input').val("");
			uploadedFiles = [];
			editPointId.set(null);
		},
		'click #cancel-route-editing': function(){
			editPointId.set(null);
			uploadedFiles = [];
		},
	});

	Template.AwaitingTimeContents.events({
		'keyup .point-waiting-time': function(event){
			$(event.currentTarget).parent().removeClass("has-error");

			if($(event.currentTarget).val().length > 0){
				try {
					juration.parse($(event.currentTarget).val());
				} catch(error){
					$(event.currentTarget).parent().addClass("has-error");
				}
			}
		}
	});

	// ~~~

	Template.RemoveTripModal.events({
		'click #remove-trip-modal .remove-trip': function(){
			Meteor.call('RemoveTrip', this._id);
			Router.go("/dashboard");
		}
	});

	// ~~~

	Template.EditTripDataModal.rendered = function(){
		var modal = $("#edit-trip-data-modal");

		$(modal).find('.input-daterange').datepicker({
			format: "yyyy-mm-dd",
			language: "pl"
		});

		if(Trips.findOne({}).points.length === 0)
			$("#edit-trip-data-modal").modal('show');
	};

	function formatDate(timestamp){
		function addLeadingZero(number){
			return (number < 10 ? "0" : "") + number;
		}

		var date = new Date(timestamp);
		return date.getFullYear() + "-" + addLeadingZero(date.getMonth() + 1) + "-" + addLeadingZero(date.getDate());
	};

	Template.EditTripDataModal.helpers({
		'beginTime': function(){
			return formatDate(this.beginTime);
		},
		'endTime': function(){
			return formatDate(this.endTime);
		}
	});

	Template.EditTripDataModal.events({
		'click #edit-trip-data-modal .btn-success': function(){
			var modal = $("#edit-trip-data-modal");

			var beginTime = (new Date($(modal).find('#start-time').val())).getTime();
			var endTime = (new Date($(modal).find('#end-time').val())).getTime();

			var title = modal.find('#title').val();

			Meteor.call('ChangeTripDuration', this._id, beginTime, endTime);
			Meteor.call('ChangeTripName', this._id, title);
		}
	});
})();

/*
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
*/

(function(){
	Template.Dashboard.events({
		'click .trip-add-new a': function(){
			Meteor.call('NewTrip', function(error, result){
				Router.go('edit-trip', { _id: result });
			});
		}
	});

	Template.Dashboard.helpers({
		'mineTrips': function(){
			return Trips.find({ user: Meteor.userId() });
		}
	})
})();

(function(){
	var map = new RouteMapRenderer();
	var mapAffix = new RouteMapRenderer();

	var routeDirectionsPixelStep = 0;
	var routeDirections = [];

	function hoverAffixMapOn(latLng){
		mapAffix.getGoogleMap().panTo(latLng);
	}

	Template.RouteBody.rendered = function(){
		$(".fancybox-image").fancybox();

		/*
		$(".fancybox-image").click(function(){
			return false;
		});
		*/

		// ~~~

		
		map.initIn('map-canvas', {
			zoom: 7,
			center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: false
		});

		map.pushRoute(PublishedTrips.findOne({}), false);

		/*

		mapAffix.initIn('map-affix-canvas', {
			zoom: 7,
			center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true
		});

		mapAffix.pushRoute(PublishedTrips.findOne({}), false);

		var trip = PublishedTrips.findOne({});
		for(var i = 0; i < trip.points.length; i++){
			for(var j = 0; j < trip.points[i].route.gmap_directions.length; j++){
				var latLng = trip.points[i].route.gmap_directions[j].coordsBegin;
				routeDirections.push(new google.maps.LatLng(latLng));
			}
		}

		routeDirectionsPixelStep = ($("#route-desc").height() - $(window).height()) / routeDirections.length;

		console.log(routeDirectionsPixelStep);

		if(routeDirectionsPixelStep > 0){
			/*
			$("#map-affix-container").affix({
				offset: {
	    			top: $("#route-desc").offset().top,
	    			left: 0,
	    			bottom: $("#route-desc").offset().bottom
	    		}
			});

			
			$(window).scroll(function(event){
				var scrollStatus = $(document).scrollTop() - $("#route-desc").offset().top;

				var stepStatus = Math.floor((scrollStatus / routeDirectionsPixelStep));

				if(stepStatus > 0){
					hoverAffixMapOn(routeDirections[stepStatus]);
					mapAffix.getGoogleMap().setZoom(10);
				}
				/*else {
					hoverAffixMapOn(routeDirections[0]);
					mapAffix.getGoogleMap().setZoom(10);
				}*
			});
			*
		}

		/*
		google.maps.event.addListener(mapAffix.getGoogleMap(), 'idle', function(){
			// mapAffix.getGoogleMap().setCenter();
			mapAffix.getGoogleMap().setZoom(10);
			hoverAffixMapOn(routeDirections[0]);
		});
		*/
	};

	Template.RouteBody.helpers({
		'points': function(){
			var points = PublishedTrips.findOne({}).points;
			
			var i = 0;
			return points.map(function(item){
				item.index = (i++);
				item.isEnd = (i === points.length);
				return item;
			});
		},
		'pointTypeHtml': function(){
			switch(this.type){
				case "normal":
					return '<span class="badge badge-normal-iconic"><span class="glyphicon glyphicon-map-marker"></span></span>';

				case "tent":
					return '<span class="badge badge-tent-iconic"><span class="glyphicon glyphicon-flag"></span></span>';

				case "house":
					return '<span class="badge badge-house-iconic"><span class="glyphicon glyphicon-home"></span></span>';
			}
		},
		'parseInt': function(x){
			return Math.round(x);
		},
		'logLength': function(x){
			return Math.round(100 + ((Math.log10(x) - 1) / 1.5) * 100);
		}
	});

	Template.RB_RouteDesc.helpers({
		'parseInt': function(x){
			return Math.round(x);
		},
		'parseDuration': function(value){
			var val = Math.round(parseInt(value));
			try {
				return juration.stringify(val, { format: 'micro' });
			} catch(error){
				return 0;
			}
		}
	});
})();

(function(){
	Template.BuyBook.events({
		'click #book_submit': function(event){
			var bookId = $("#book_id").val();
			var bookKey = $("#book_key").val();

			Meteor.call("BindBook", bookId, bookKey, function(error, result){
				if(!result)
					alert("błąd walidacji - czy na pewno podałeś odpowiedni klucz?");
				else
					alert("powiązano książeczkę");
			});
		}
	});
})();

/*
(function(){
	Template.DescriptionContents.rendered = function(){
		Uploader.finished = function(index, fileInfo, templateContext){
			console.log(fileInfo);
		};
	};
})();
*/