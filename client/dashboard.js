Template.Dashboard.events({
	'click .trip-add-new a': function(){
		Meteor.call('NewTrip', function(error, result){
			Router.go('edit-trip', { _id: result });
		});
	}
});

Template.Dashboard.helpers({
	'mineTrips': function(){
		return Trips.find({user: Meteor.userId()}, {_id: 1});
	},
	'canAddTrip': function(){
		console.log(Meteor.user());
		return !Meteor.user().profile.isRace;
	}
});

Template.PrintTrip.helpers({
	'parseInt': function(x){
		return Math.round(x);
	},
	'isTrullyMineTrip': function(){
		return (this.user === Meteor.userId());
	},
	'isComradeTrip': function(){
		return Meteor.userId() !== null && this.comrades.race === Meteor.userId();
	},
	'comradeTripData': function(){
		return {
			_id: this.publish.id
		};
	},
	'publicTripData': function(){
		return {
			_id: this._id
		};
	}
});

function sumOf(trips, func){
	return trips.reduce(function(prev, curr){
		return prev + func(curr);
	}, 0);
}

function getDistanceSum(trips){
	return Math.round(sumOf(trips, function(curr){
		return curr.stats.distance;
	}));
}

function getDurationSum(trips){
	return Math.round(sumOf(trips, getDurationForTrip));
}

Template.UserStats.onRendered(function(){
	Template.instance().$('[data-toggle="tooltip"]').tooltip();
});

Template.UserStats.helpers({
	'distance': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		return getDistanceSum(trips);
	},
	'duration': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		return getDurationSum(trips);
	},
	'distanceDivDuration': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		return Math.round(getDistanceSum(trips) / getDurationSum(trips));
	},
	'drivers': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		return Math.round(sumOf(trips, function(curr){
			return curr.points.length - 1;
		}));
	},
	'waitingTime': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		try {
			return juration.stringify(Math.round(sumOf(trips, getWaitingTimeForTrip)), { format: 'micro' });
		} catch(error){
			return 0;
		}
	},
	'co2': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		var grams = Math.floor(getDistanceSum(trips) * 130);
		if(grams > 1000)
			return Math.floor(grams / 1000) + " kg";
		else
			return grams + " g";
	},
	'countries': function(){
		if(this.dbData === undefined)
			return "-";

		var countries = {};

		var trips = this.dbData.fetch();

		trips.forEach(function(trip){
			console.log(trip);
			trip.points.forEach(function(point){
				point.route.stats.countries.forEach(function(routeCountryStats){
					if(countries[routeCountryStats.countryCode] === undefined)
						countries[routeCountryStats.countryCode] = 0;

					countries[routeCountryStats.countryCode] += routeCountryStats.distance;
				});
			});
		});

		return Object.keys(countries).map(function(country){
			return {
				countryName: country.toUpperCase(),
				countryDistance: countries[country] + ""
			};
		});
	},
	'distanceMakesSense': function(){
		var trips = this.dbData.fetch();
		return getDistanceSum(trips) > 0;
	},
	'durationMakesSense': function(){
		var trips = this.dbData.fetch();
		return getDurationSum(trips) > 0;
	},
	'distanceDivDurationMakesSense': function(){
		var trips = this.dbData.fetch();
		return getDurationSum(trips) > 0 && getDistanceSum(trips) > 0;
	},
	'waitingTimeMakesSense': function(){
		if(this.dbData === undefined)
			return "-";

		var trips = this.dbData.fetch();
		try {
			return juration.stringify(Math.round(sumOf(trips, getWaitingTimeForTrip)), { format: 'micro' }).length > 0;
		} catch(error){
			return false;
		}
	},
	'co2MakesSense': function(){
		var trips = this.dbData.fetch();
		return getDistanceSum(trips) > 0;
	},
	'anyStatsMakesSense': function(){
		var trips = this.dbData.fetch();
		return getDistanceSum(trips) > 0;
	}
});