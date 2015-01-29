Router.route('/', function(){
	if(Meteor.userId())
		this.render('Dashboard');
	else
		this.render('LandingPage');
});

Router.route('/edit-trip', function(){
	this.render('EditTrip');
});