Router.plugin('dataNotFound', {
	notFoundTemplate: 'NotFound'
});

BouncerController = RouteController.extend({
	onBeforeAction: function(){
		if(Meteor.user() !== null)
			this.next();
		else
			this.redirect('/');
	}
});

Router.route('/', {
	name: 'index',
	template: 'StaticPage',

	action: function(){
		this.render();
	}
});

// if(__isDev()){

	// Strony publiczne:

	Router.route('/show/:_id', {
		name: 'show-trip',
		template: 'ShowTrip',

		waitOn: function(){
			return Meteor.subscribe('get-published-trip-data', this.params._id);;
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
			return Meteor.subscribe('book-user-trips', this.params.id);
			// return [
			// 	Meteor.subscribe('book-user-trips', this.params.id),
			// 	Meteor.subscribe('book-user-profile', this.params.id)
			// ];
		},
		data: function(){
			return PublishedTrips.find({});
		},
		action: function(){
			this.render();
		}
	});

	Router.route('/hints', {
		name: 'hints',
		template: 'Hints',

		waitOn: function(){
		},
		action: function(){
			this.render();
		}
	});

	Router.route('/insurance', {
		name: 'insurance',
		template: 'Insurance',

		waitOn: function(){
		},
		action: function(){
			this.render();
		}
	});

	Router.route('/letters', {
		name: 'letters',
		template: 'Letters',

		waitOn: function(){
			return Meteor.subscribe('letters-collection');
		},
		data: function(){
			return Letters.find({});
		},
		action: function(){
			this.render();
		}
	});

	// Router.route('/letters/about', {
	// 	name: 'letters-about',
	// 	template: 'LettersAbout',

	// 	waitOn: function(){
	// 	},
	// 	action: function(){
	// 		this.render();
	// 	}
	// });

	// Router.route('/buy-book', {
	// 	name: 'buy-book',
	// 	template: 'BuyBook',

	// 	waitOn: function(){
	// 	},
	// 	action: function(){
	// 		this.render();
	// 	}
	// });

	// Strony prywatne (dostępne po zalogowaniu):

	Router.route('/dashboard', {
		name: 'dashboard',
		template: 'Dashboard',
		controller: 'BouncerController',

		data: function(){
			return Meteor.subscribe('mine-trips');
		},
		action: function(){
			this.render();
		}
	});

	Router.route('/edit-trip/:_id', {
		name: 'edit-trip',
		template: 'EditTrip',
		controller: 'BouncerController',

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

	Router.route('/bind-book', {
		name: 'bind-book',
		template: 'BindBook',
		controller: 'BouncerController',

		waitOn: function(){
		},
		action: function(){
			this.render();
		}
	});

// }

/*
	Router.route('/history', {
		name: 'history',
		template: 'HistoryPage',

		action: function(){
			this.render();
		}
	});
*/