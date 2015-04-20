/*

client.js

*/

(function(){
	var routeId = undefined;

	var map_ = new RouteMapRenderer();

	var editPointId = new ReactiveVar(null);
	var insertAfterId = new ReactiveVar(null);

	var isRendered = false;

	var uploadedFiles = [];

	Template.EditTrip.onRendered(function(){
		routeId = this._id;

		map_.initIn('map-canvas', {
			zoom: 7,
			center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP
			// disableDefaultUI: true
		});

		// (*, true, true) => tylko publikacja wysyła trasę na serwer - optymalizacja
		map_.pushRoute(Trips.findOne({}), true, false);

		isRendered = true;
		// makeRoute();

		$('[data-toggle="tooltip"]').tooltip();

		/*
		Uploader.finished = function(index, fileInfo, templateContext){
			uploadedFiles.push(fileInfo.url);
		};
		*/

	    try {
	        FB.XFBML.parse();
	    }catch(e) {}
	});

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
			return '<img src="/'+this.type+'_marker.png">';
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

			routePoint.type = pointType.get();

			if(	modal.find('.description-text').length == 1 &&
				modal.find('.description-text').val().length > 0)
				routePoint.desc.text = modal.find('.description-text').val();

			routePoint.desc.pictures = pictures.get(); // clone [ http://davidwalsh.name/javascript-clone-array ]

			var waitingTime = getPointWaitingTime(modal);
			Meteor.call('NewRoutePoint', this._id, insertAfterId.get(), routePoint, waitingTime);
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

	Template.AddPointModal.onRendered(function(){
		$("#new-point-modal").on('show.bs.modal', function(){
			var modal = $('#new-point-modal');

			pictures.set([]);
			pointType.set("through");
			$(modal).find('.trip-name').val("");
			uploadedFiles = [];
			$(modal).find('.point-waiting-time').val("");
			$(modal).find('.description-text').val("");
		});
		
	});

	// ~~~

	Template.EditPointModal.events({
		'click #edit-point': function(event){
			var modal = $("#edit-point-modal");

			var placeName = getValueOfTripNameSelectizeInModal(modal);
			
			// ~~~

			var routePoint = getPoint(editPointId.get());

			routePoint.name = placeName;

			// pola dodatkowe:

			routePoint.type = pointType.get();

			if(	modal.find('.description-text').length == 1 &&
				modal.find('.description-text').val().length > 0)
				routePoint.desc.text = modal.find('.description-text').val();

			routePoint.desc.pictures = pictures.get();

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

	Template.EditPointModal.onRendered(function(){
		$("#edit-point-modal").on('show.bs.modal', function(){
			var point = null;
			if((point = getPoint(editPointId.get())) === undefined)
				return;

			var modal = $("#edit-point-modal");

			modal.find('.description-text').val(point.desc.text);
			descChars.set(point.desc.text);

			pointType.set(point.type);

			setRouteWaitingTimeInModal(modal, point);

			initializeSelectize(modal.find('.trip-name'), point.name);

			pictures.set(point.desc.pictures);
		});
	});

	// ~~~

	var pointType = new ReactiveVar("");

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

	Template.ModalPointCommonContents.helpers({
		'atLeastOnePoint': function(){
			return Trips.findOne({}).points.length > 0;
		},
		'showAwaitingTimeContents': function(){
			var points = Trips.findOne({}).points;

			if(points.length > 0){
				if(points[0].id === editPointId.get())
					return false;
				else
					return true;
			}
			else
				return false;
		}
	});

	Template.ModalPointCommonContents.onRendered(function(){
		initializeSelectize(".trip-name");

		Tracker.autorun(function(){
			var parent = $(".modal").find("#point-type");
			if(parent.length > 0){
				parent.find('.point-type-option').removeClass("active");
				parent.find('[data-type="' + pointType.get() + '"]').addClass("active");
			}
		});

		/*
		$(".modal .modal-point-common-contents").toArray().forEach(function(item){
			$(item).closest(".modal").on('show.bs.modal', function(){
				console.log("modal pcc opened!");
			});
		});
		*/
	});

	Template.ModalPointCommonContents.events({
		'click .point-type-option': function(event){
			pointType.set($(event.currentTarget).data("type"));
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

	Template.DescriptionContents.events({
		'click .delete-file': function(event){
			event.stopPropagation();

			console.log(editPointId.get());

			var imageTarget =  $(event.currentTarget).parent('.image-file-cell').find('.fancybox-image').attr('href');
			Meteor.call('fs_removeScreen', Trips.findOne()._id, editPointId.get(), imageTarget, function(error, result){
				if(result){
					pictures.set(pictures.get().filter(function(item){
						return (item !== imageTarget);
					}));
				}
			});
		}
	});

	function getMaxPictures() {
		switch(pointType.get()){
			case "through":
				return 2;

			case "sleep":
				return 4;

			case "adventure":
				return 100;
		}
	}

	function getMaxDescCharacters() {
		switch(pointType.get()){
			case "through":
				return 160;

			case "sleep":
				return 320;

			case "adventure":
				return Infinity;
		}
	}

	var descChars = new ReactiveVar("");

	Template.DescriptionContents.helpers({
		'atLeastOnePointPicture': function(){
			return pictures.get().length > 0;
		},
		'pointPictures': function(){
			return pictures.get();
		},
		'pointPicturesCount': function(){
			return pictures.get().length;
		},
		'maxPicturesNum': function(){
			return getMaxPictures();
		},
		'descCharacterCount': function(){
			return descChars.get().length;
		},
		'maxDescCharactersNum': function(){
			return getMaxDescCharacters();
		},
		'isMaxDescCharactersNum': function(){
			return getMaxDescCharacters() !== Infinity;
		},
		'canAddMorePictures': function(){
			return pictures.get().length < getMaxPictures();
		}
	});

	function observeInputChange(element, callback) {
		$(element).each(function() {
				var elem = $(this);

				// Save current value of element
				elem.data('oldVal', elem.val());

				// Look for changes in the value
				elem.bind("propertychange change click keyup input paste", function(event){
				// If value has changed...
				if (elem.data('oldVal') != elem.val()) {
					// Updated stored value
					var oldVal = elem.data('oldVal');
					elem.data('oldVal', elem.val());

					// Do action
					callback(event, elem.val(), oldVal);
				}
			});
		});
	}

	Template.DescriptionContents.onRendered(function(){
		$(".fancybox-image").fancybox();

		observeInputChange(".description-text", function(event, newValue, oldValue){
			if(newValue.length > getMaxDescCharacters()){
				newValue = oldValue;
				$(".description-text").val(newValue);
			}
			descChars.set(newValue);
		});
	});

	// ~~~

	var wasBinded = false;

	Template.DescriptionContents.onCreated(function(){
		if(!wasBinded){
			wasBinded = true;
			addUploaderEndPoint(function(url){
				var pics = pictures.get();
				pics.push(url);
				pictures.set(pics);
			});
		}
	})

	// ~~~

	Template.PublishModal.helpers({
		'canPublishNumOfPoints': function(){
			return Trips.findOne({}).points.length >= 2;
		}
	});

	Template.PublishModal.events({
		'click #do-publish': function(){
			Meteor.call('PublishTrip', Trips.findOne({})._id, function(error, result){
				console.log(error, result);

				if(result !== undefined){
					if(result.status === NO_GMAP_POINTS)
						map_.pushRoute(Trips.findOne({}), true, true);

					alert(result.message);
				}
			});
		},
		'click #stop-publish': function(){
			Meteor.call('UnPublishTrip', Trips.findOne({})._id);
		},
		'click #reload-publish': function(){
			Meteor.call('UnPublishTrip', Trips.findOne({})._id, function(){
				Meteor.call('PublishTrip', Trips.findOne({})._id, function(error, result){
					if(result !== undefined){
						if(result.status === NO_GMAP_POINTS)
							map_.pushRoute(Trips.findOne({}), true, true);

						alert(result.message);
					}
				});
			});
		}
	});

	// ~~~

	function setRouteWaitingTimeInModal(modal, point){
		try {
			var string = juration.stringify(point.route.waitingTime, { format: 'micro' });
			// modal.find('.point-waiting-time').val(string);
			awaitingTime.set(string);
		} catch(error){
			awaitingTime.set("");
		}
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

	// ~~~

/*
	

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

			route.desc.pictures = pictures.get();

			Meteor.call('EditRoute', this._id, point.id, route);

			// ~~~

			$('#edit-route-modal').find('input').val("");
			editPointId.set(null);
		},
		'click #cancel-route-editing': function(){
			editPointId.set(null);
		},
	});
	*/

	var awaitingTime = new ReactiveVar("");

	function onInputPointWaitingTimeChanged(control){
		$(control).parent().removeClass("has-error");

		if($(control).val().length > 0){
			try {
				juration.parse($(control).val());
			} catch(error){
				$(control).parent().addClass("has-error");
			}
		}
	}

	Template.AwaitingTimeContents.onRendered(function(){
		Tracker.autorun(function(){
			var awaitingTimeStr = awaitingTime.get();
			$('.point-waiting-time').val(awaitingTimeStr);
			onInputPointWaitingTimeChanged($('.point-waiting-time'));

			$(".choose-awaiting-time-option").removeClass("active");
			$(".choose-awaiting-time-option").toArray().forEach(function(item){
				if($(item).html().replace(/\s+/g, "") === awaitingTimeStr)
					$(item).addClass("active");
			});
		});
	});

	Template.AwaitingTimeContents.helpers({
		'awaitingTime': function(){
			return awaitingTime.get();
		}
	});

	Template.AwaitingTimeContents.events({
		'keyup .point-waiting-time': function(event){
			awaitingTime.set($(event.currentTarget).val());
			// onInputPointWaitingTimeChanged($(event.currentTarget));
		},
		'click .choose-awaiting-time-option': function(event){
			var awaitingTimeStr = $(event.currentTarget).html().replace(/\s+/g, "");
			awaitingTime.set(awaitingTimeStr);
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

		$(modal).on('show.bs.modal', function(){
			var trip = Trips.findOne();
			$(modal).find("#bind-race-trip").val(trip.comrades.race !== null ? trip.comrades.race : "");
		});

		// ~~~

		if(Trips.findOne({}).points.length === 0)
			$(modal).modal('show');
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
			var beginTime = this.beginTime;

			if(beginTime === 0)
				beginTime = Date.now();

			return formatDate(beginTime);
		},
		'endTime': function(){
			var endTime = this.endTime;

			if(endTime === 0)
				endTime = Date.now();

			return formatDate(endTime);
		},
		'officialAutostopRaces': function(){
			return Meteor.users.find({ 'profile.isRace': true });
		}
	});

	Template.EditTripDataModal.events({
		'click #edit-trip-data-modal .btn-success': function(){
			var modal = $("#edit-trip-data-modal");

			var beginTime = (new Date($(modal).find('#start-time').val())).getTime();
			var endTime = (new Date($(modal).find('#end-time').val())).getTime();

			var title = modal.find('#title').val();

			var raceBinded = modal.find('#bind-race-trip').val();
			if(raceBinded.length === 0)
				raceBinded = null;

			Meteor.call('ChangeTripDuration', this._id, beginTime, endTime);
			Meteor.call('ChangeTripName', this._id, title);
			Meteor.call('BindRaceToTrip', this._id, raceBinded);
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
		'parseInt': function(x){
			return Math.round(x);
		},
		'mineTrips': function(){
			return Trips.find({}, {_id: 1});
		},
		'isTrullyMineTrip': function(){
			return (this.user === Meteor.userId());
		},
		'comradeTripData': function(){
			return {
				_id: this.publish.id
			};
		},
		'canAddTrip': function(){
			console.log(Meteor.user());
			return !Meteor.user().profile.isRace;
		}
	})
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