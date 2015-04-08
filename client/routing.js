Router.plugin('dataNotFound', {
	notFoundTemplate: 'NotFound'
});

Router.route('/', {
	name: 'index',
	template: 'LandingPage',

	action: function(){
		this.render();
	}
});

Router.route('/static', {
	name: 'static',
	template: 'StaticPage',

	action: function(){
		this.render();
	}
});

Router.route('/history', {
	name: 'history',
	template: 'HistoryPage',

	action: function(){
		this.render();
	}
});


Router.route('/dashboard', {
	name: 'dashboard',
	template: 'Dashboard',

	data: function(){
		return Meteor.subscribe('mine-trips');
	},
	action: function(){
		this.render();
	}
});

Router.route('/buy-book', {
	name: 'buy-book',
	template: 'BuyBook',

	waitOn: function(){
	},
	action: function(){
		this.render();
	}
});

Router.route('/edit-trip/:_id', {
	name: 'edit-trip',
	template: 'EditTrip',

	waitOn: function(){
		return [
			Meteor.subscribe('official-races'),
			Meteor.subscribe('get-trip-data', this.params._id)
		];
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

Router.route('/book/:id', {
	name: 'book-owner-published-trips',
	template: 'Profile',

	waitOn: function(){
		return Meteor.subscribe('book-user-data', this.params.id);
	},
	data: function(){
		return PublishedTrips.find({});
	},
	action: function(){
		this.render();
	}
});