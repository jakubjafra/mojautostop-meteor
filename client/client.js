/*

client.js

*/

(function(){
	var map = null;

	Template.EditTrip.rendered = function(){
		var mapOptions = {
			zoom: 7,
			center: new google.maps.LatLng(52.40637, 16.92517),
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true
		};

		map = new google.maps.Map(
			document.getElementById('map-canvas'),
			mapOptions
		);
	};
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