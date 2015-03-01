Router.route('/', function(){
	this.render('LandingPage');
});

Router.plugin('dataNotFound', {
	notFoundTemplate: 'NotFound'
});

Router.route('/dashboard', {
	name: 'dashboard',
	template: 'Dashboard',

	waitOn: function(){
		return Meteor.subscribe('mine-trips');
	},
	action: function(){
		this.render();
	}
});

Router.route('/edit-trip/:_id', {
	name: 'edit-trip',
	template: 'EditTrip',

	waitOn: function(){
		return Meteor.subscribe('get-trip-data', this.params._id);
	},
	data: function(){
		return Trips.findOne({ _id: this.params._id });
	},
	action: function(){
		this.render();
	}
});

Router.route('/show/:_id', {
	name: 'show-trip',
	template: 'ShowTrip',

	waitOn: function(){
		return Meteor.subscribe('get-published-trip-data', this.params._id);
	},
	data: function(){
		return PublishedTrips.findOne({ _id: this.params._id });
	},
	action: function(){
		this.render();
	}
});