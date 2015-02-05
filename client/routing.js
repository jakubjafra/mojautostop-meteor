Router.route('/index', function(){
	this.render('LandingPage');
});

Router.route('/', {
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
})