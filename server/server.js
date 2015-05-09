/*

server.js

*/

Fiber = Npm.require("fibers");
Future = Npm.require("fibers/future");

CONFIG = {
	NEW_ID_ON_PUBLISH: false,
	FULL_TRIP_STATS_PARSING: false
};

WAIT_TIME_FOR_GEOCODE_REQUESTS = 1500;

var observedTrips = {};

function bindRoutesToPoints(points){
	if(points.length >= 2){
		for(var i = 0; i < points.length; i++){
			var nextRoutePointId = null;
			if(points[i + 1] != undefined)
				nextRoutePointId = points[i + 1].id;

			if(	points[i].route.beginId === points[i].id &&
				points[i].route.endId === nextRoutePointId)
				continue;
			else
				points[i].route = new Route(points[i].id, nextRoutePointId);
		}
	}
}

function getCountryCodeForCoords(coords){
	var fut = new Future();

	Meteor.setTimeout(function(){
		try {
			var lat = coords.lat;
			var lon = coords.lng;

			if(typeof lat !== "number" || typeof lon !== "number")
				fut['return']("");

			// console.log("getCountryCodeForCoords -> timeout ended. firing HTTP!");

			var ret = HTTP.get("http://nominatim.openstreetmap.org/reverse?format=json&zoom=0&lat=" + lat + "&lon=" + lon);

			// console.log("http://nominatim.openstreetmap.org/reverse?format=json&zoom=0&lat=" + lat + "&lon=" + lon);
			// console.log('getCountryCodeForCoords');
			// console.log(ret.data);

			if(ret.data === null || ret.data === undefined || ret.data === [] || ret.data.length === 0 || ret.data.address === undefined){
				// użyj geocodera googlowskiego durniu!
				fut['return'](null);
			} else {
				fut['return'](ret.data.address.country_code);
			}
		} catch(error){
			console.log(error);
			fut['return'](getCountryCodeForCoords(coords));
		}
	}, WAIT_TIME_FOR_GEOCODE_REQUESTS);
	
	return fut.wait();
	
}

function getCountryCodeForName(name){
	var fut = new Future();

	Meteor.setTimeout(function(){
		try {
			// console.log("getCountryCodeForName -> timeout ended. firing HTTP!");

			var ret = HTTP.get("http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=" + name);

			// console.log("http://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=" + name);

			// console.log('getCountryCodeForName');
			// console.log(ret.data);

			if(ret.data !== undefined && ret.data.length > 0)
				fut['return'](ret.data[0].address.country_code);
			else {
				// użyj geocodera googlowskiego durniu!
				console.log("_ NOMINATIM GEOCODER FAILED. USING GOOGLES' ONE.")

				var params = 	"https://maps.googleapis.com/maps/api/geocode/json" + 
								"?key=AIzaSyAYuekduAHjKRimMJpVQ7s99ukZF94kzY8" +
								"&address=" + name;

				var gret = HTTP.get(params);

				gret = gret.data;

				if(gret.status !== "OK"){
					console.log("_ _ _ GOOGLE GEOCODER ERROR");
					console.log(params);
					console.log(gret.status);
					console.log(gret.error_message);

					fut['return'](null);
				}

				var countryCode = null;

				gret.results[0].address_components.forEach(function(component){
					for(var i = 0; i < component.types.length; i++){
						if(component.types[i] === "country" || component.types[i] === "political"){
							countryCode = component.short_name;
							break;
						}
					}
				});

				fut['return'](countryCode);
			}
		} catch(error){
			console.log(error);
			fut['return'](getCountryCodeForName(name));
		}
	}, WAIT_TIME_FOR_GEOCODE_REQUESTS);
	
	return fut.wait();
}

Accounts.onCreateUser(function(options, user){
	user.profile = new UserProfile();
	return user;
});

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

Meteor.methods({
	'RegisterToNewsletter': function(email){
		if(!validateEmail(email))
			return false;
		
		Newsletter.insert(new NewsletterApplication(email));
		return true;
	},

	'SendInsuranceEmail': function(data){
		InsuranceEmails.insert(data);
	},

	// ~~~

	'ChangeProfileData': function(firstName, lastName, specialNick, specialUrl){
		Meteor.users.update(Meteor.userId(), {
			$set: {
				'profile.firstName': firstName,
				'profile.lastName': lastName,
				'profile.specialNick': specialNick,
				'profile.specialUrl': specialUrl
			}
		});

		console.log("Edited #" + Meteor.userId() + " user profile.");
	},
	'ChangeProfilePicture': function(url){
		Meteor.users.update(Meteor.userId(), {
			$set: {
				'profile.photo': url
			}
		});

		console.log("Changed #" + Meteor.userId() + " profile picture.");
	},

	// ~~~

	'BindBook': function(bookId, bookKey){
		bookId = parseInt(bookId);

		if(	algorythm.isMathing(bookId, bookKey) &&
			Books.findOne({bookId: bookId}) === undefined){

			Books.insert(new Book(
				bookId,
				Meteor.userId()
			));
			
			Meteor.users.update(Meteor.userId(), {
				$set: {
					'profile.isPremium': true,
					'profile.premiumBookId': bookId
				}
			});

			return true;
		}
		else
			return false;
	},

	// ~~~

	'NewTrip': function(){
		if(Meteor.userId() !== null){
			return Trips.insert(new Trip("Nienazwany trip", Meteor.userId()));
		}
	},
	'RemoveTrip': function(tripId){
		var trip = Trips.findOne(tripId);

		if(trip.user !== Meteor.userId())
			return false;

		Trips.remove(trip._id);
		if(trip.publish.id !== null)
			PublishedTrips.remove(trip.publish.id);
		
		RemovedTrips.insert(trip);

		return true;
	},

	// ~~~

	'ChangeTripName': function(tripId, newTripName){
		Trips.update(tripId, {
			$set: { name: newTripName }
		});

		console.log("Renamed #" + tripId + " to \"" + newTripName + "\"");
	},
	'ChangeTripDuration': function(tripId, newBeginTime, newEndTime){
		Trips.update(tripId, {
			$set: {
				beginTime: newBeginTime,
				endTime: newEndTime
			}
		});

		console.log("Changed #" + tripId + " duration.");
	},
	'BindRaceToTrip': function(tripId, bindedRace){
		Trips.update(tripId, {
			$set: {
				'comrades.race': bindedRace
			}
		});

		console.log("Binded #" + tripId + " to " + bindedRace + ".");
	},

	'PublishTrip': function(tripId){
		console.log("PublishTrip method called on #" + tripId);

		function processTrip(tripId){
			// 1. publikowanie = obliczanie statystyk
			Meteor.call('GenerateStatsFor', tripId, function(error, trip){
				// 2. usunięcie starego tripa (jeśli w ogóle jakiś był)
				if(error !== undefined)
					console.log(error);

				if(trip === undefined){
					Trips.update(tripId, {
						$set: {
							'publish.isProcessing': true
						}
					});

					return;
				}

				console.log(trip);

				if(trip.publish.id !== null)
					PublishedTrips.remove(trip.publish.id);

				// 3. publikowanie = escapowanie danych
				trip._id = trip.publish.id;
				if(trip.publish.id === null || CONFIG.NEW_ID_ON_PUBLISH)
					delete trip._id;

				/*
				trip.points = trip.points.map(function(point){
					delete point.route.gmap_directions;
					return point;
				});
				*/

				// publish jest teraz w "drugą stronę"
				trip.publish.visible = true;
				trip.publish.id = tripId;

				// 3. publikowanie = kopiowanie escapeniętych danych
				var publishTripId = PublishedTrips.insert(trip);

				// ~~~

				Trips.update(tripId, {
					$set: {
						'publish.visible': true,
						'publish.id': publishTripId,
						'publish.isProcessing': false
					}
				});

				console.log("Publish procedure finished for #" + trip._id);
			});
		}

		Trips.update(tripId, {
			$set: {
				'publish.isProcessing': true
			}
		});

		var maybeTrip = Trips.findOne(tripId);

		if(maybeTrip.points.length < 2){
			return {
				freeze: false,
				message: "Dodaj co najmniej 2 punkty"
			};
		}

		var allGood = true;

		for(var i = 0; i < (maybeTrip.points.length - 1); i++){
			if(maybeTrip.points[i].route.gmap_directions.length === 0)
				allGood = false;
		}

		if(!allGood){
			console.log("Waiting for gmap_directions for trip #" + tripId + " ...");

			// Zaczynamy zabawę w czekanie...
			observedTrips[tripId] = Trips.find({
				_id: tripId
			}).observe({
				changed: function(newDoc, oldDoc){
					console.log("Observed that gmap_directions updated, firing PublishTrip");		
					Meteor.call('PublishTrip', tripId);
				}
			});

			return {
				status: NO_GMAP_POINTS,
				message: "Serwer przetwarza twoje żądanie. Czekaj cierpliwie."
			};
		}
		else {
			console.log("Publishing trip #" + tripId + " ...");

			if(observedTrips[tripId] !== undefined)
				observedTrips[tripId].stop();

			processTrip(tripId);
		}
	},
	'UnPublishTrip': function(tripId){
		var trip = Trips.findOne(tripId);

		PublishedTrips.update(trip.publish.id, {
			$set: { 'publish.visible': false }
		});

		Trips.update(tripId, {
			$set: { 'publish.visible': false }
		});
	},

	// ~~~

	'NewRoutePoint': function(tripId, insertAfter, newPoint, waitingTime){
		var points = Trips.findOne(tripId).points;

		var newPoints = [];

		if(insertAfter == null)
			newPoints.push(newPoint);

		for(var i = 0; i < points.length; i++){
			var currPoint = points[i];

			newPoints.push(currPoint);
			if(insertAfter != null && currPoint.id === insertAfter)
				newPoints.push(newPoint);
		}

		bindRoutesToPoints(newPoints);

		for(var i = 0; i < points.length; i++){
			var currPoint = points[i];

			if(insertAfter != null && currPoint.id == insertAfter){
				// dodaje się przejazd między punktem N-1 a N
				// więc trzeba czas czekania dodać do punktu N-1 a nie
				// zostawiac go w N
				currPoint.route.waitingTime = waitingTime;
				waitingTime = null;
			}
		}

		if(newPoints.length > points.length){
			console.log("Added new point after #" + insertAfter + " to trip #" + tripId);

			Trips.update(tripId, {
				$set: { points: newPoints }
			});
		}
		else{
			console.log("[ERR] Tried to add new point after #" + insertAfter + " to trip #" + tripId);
			console.log(newPoint);
		}
	},
	'RemoveRoutePoint': function(tripId, pointId){
		var points = Trips.findOne(tripId).points;

		var newPoints = points.filter(function(curr){
			return !(curr.id === pointId);
		});

		bindRoutesToPoints(newPoints);

		Trips.update(tripId, {
			$set: { points: newPoints }
		});

		console.log("Removed point #" + pointId + " from trip #" + tripId);
	},
	'EditRoutePoint': function(tripId, pointId, newPoint, awaitingTime){
		newPoint.id = pointId;

		var newPoints = Trips.findOne(tripId).points.map(function(curr){
			if(curr.id === pointId){
				newPoint.route = curr.route;
				// awaitingTime w edycji punktu jest czas jaki spędzono czekając na stopa
				// by dojechać do N+1
				newPoint.route.waitingTime = awaitingTime;
				return newPoint;
			}
			else
				return curr;
		});

		console.log("Replaced point #" + pointId + " to new version from trip #" + tripId);

		Trips.update(tripId, {
			$set: { points: newPoints }
		});
	},
	'EditRoute': function(tripId, pointId, newRouteObj){
		var newPoints = Trips.findOne(tripId).points.map(function(curr){
			if(curr.id == pointId)
				curr.route = newRouteObj;
			
			return curr;
		});

		Trips.update(tripId, {
			$set: { points: newPoints }
		});

		console.log("Replaced route desc #" + pointId + " to new version from trip #" + tripId);
	},

	'AddTripRouteDirections': function(tripId, pointId, directions){
		var newPoints = Trips.findOne(tripId).points;

		for(var i = 0; i < newPoints.length; i++){
			if(newPoints[i].id === pointId){
				newPoints[i].route.gmap_directions = directions;
				break;
			}
		}

		Trips.update(tripId, {
			$set: { points: newPoints }
		});

		console.log('Updated gmap_directions for trip #' + tripId);
	},

	// ~~~

	'GenerateStatsFor': function(tripId){
		var trip = Trips.findOne(tripId);

		trip.points = trip.points.map(function(point){
			if(point.route.endId !== null && point.route.gmap_directions.length > 0){
				console.log('_ _ Fully processing this point.', point.name);

				var begin = point.route.gmap_directions[0].coordsBegin;
				var end = point.route.gmap_directions[point.route.gmap_directions.length - 1].coordsEnd;

				var countryBegin = getCountryCodeForCoords(begin);
				var countryEnd = getCountryCodeForCoords(end);

				// head odcinka (punkt) jest w jakimś konkretnym kraju
				point.stats.countryCode = countryBegin;

				// ~~~

				var dist = point.route.gmap_directions.reduce(function(prev, curr){
					return prev + (curr.distance / 1000);
				}, 0);

				// długość danego odcinka
				point.route.stats.distance = dist;

				// ~~~

				point.route.stats.countries = [];

				if(countryBegin === countryEnd){
					// prosta sprawa...
					point.route.stats.countries.push({
						countryCode: countryBegin,
						distance: dist
					});
				} else {
					// już trochę trudniej...
					var countryStats = {};
					var lastCountry = countryBegin;

					if(CONFIG.FULL_TRIP_STATS_PARSING){
						for(var i = 0; i < point.route.gmap_directions.length; i++){
							var countryBegin = getCountryCodeForCoords(point.route.gmap_directions[i].coordsBegin);
							var countryEnd = getCountryCodeForCoords(point.route.gmap_directions[i].coordsEnd);

							if(countryStats[countryBegin] == undefined)
								countryStats[countryBegin] = 0;

							if(countryStats[countryEnd] == undefined)
								countryStats[countryEnd] = 0;

							if(countryBegin === countryEnd)
								countryStats[countryBegin] += point.route.gmap_directions[i].distance;
							else {
								// to jest still chujowe
								countryStats[countryBegin] += Math.floor(point.route.gmap_directions[i].distance / 2);
								countryStats[countryEnd] += Math.floor(point.route.gmap_directions[i].distance / 2);
							}
						}
					} else {
						countryStats[countryBegin] += Math.floor(dist / 2);
						countryStats[countryEnd] += Math.floor(dist / 2);
					}

					point.route.stats.countries = [];
					for(var country in countryStats){
						point.route.stats.countries.push({
							countryCode: country,
							distance: countryStats[country]
						});
					}
				}
			} else {
				// ostatni punkt na trasie:
				console.log("_ _ Searching end point countryCode.", point.name);

				point.stats.countryCode = getCountryCodeForName(point.name);

				if(point.stats.countryCode === null) {
					// A tu użyj poprzedniej lokacji państwa jeśli już naprawdę
					// jesteśmy w takiej dupie.
					console.log("_ _ _ geocoding returned null, szklana pułapka.");

					var lastPoint = trip.points[trip.points.length - 1];
					var lastPointCountries = lastPoint.route.stats.countries;
					point.stats.countryCode = lastPointCountries[lastPointCountries - 1].countryCode;
				}
			}

			return point;
		});

		trip.stats.distance = trip.points.reduce(function(prev, point){
			return prev + point.route.stats.distance;
		}, 0);

		Trips.update(trip._id, trip);

		console.log("Successful stats generation for #" + trip._id);

		return trip;
	},

	// ~~~

	'g_GenerateStatsFor': function(){
		var trips = Trips.find({}).fetch();

		trips.forEach(function(trip){
			Meteor.call('GenerateStatsFor', trip._id);
		});
	},

	// ~~~

	'MakeRace': function(userId, raceName, bookId){
		Meteor.users.update(userId, {
			$set: {
				'profile.isRace': true,
				'profile.isPremium': true,
				'profile.firstName': raceName,
				'profile.premiumBookId': bookId
			}
		});

		Books.insert(new Book(
			bookId,
			userId
		));
	},

	// ~~~

	'fs_removeScreen': function(tripId, pointId, imagePath){
		var trip = Trips.findOne(tripId);

		if(trip.user !== Meteor.userId())
			return false;

		console.log(UploadServer);

		trip.points.forEach(function(point){
			if(point.id === pointId){
				function filterImages(image){
					if(image === imagePath){
						UploadServer.delete(decodeURIComponent(imagePath.substring(imagePath.lastIndexOf('/') + 1)));
						return false;
					}
					else
						return true;
				}

				try {
					point.desc.pictures = point.desc.pictures.filter(filterImages);
					point.route.desc.pictures = point.desc.pictures.filter(filterImages);
				} catch(error){
					// nie usunięto bo już nie istnieje
				}
			}
		});

		return true;
	}
});

Meteor.startup(function(){
	Meteor.publish("get-trip-data", function(tripId){
		return Trips.find({ _id: tripId });
	});

	Meteor.publish("get-published-trip-data", function(publishTripId){
		var publishedTrip = PublishedTrips.findOne({ _id: publishTripId, 'publish.visible': true });

		if(publishedTrip === undefined) {
			return [];
		} else {
			// return PublishedTrips.find({ _id: publishTripId, 'publish.visible': true });
			return [
				PublishedTrips.find({ _id: publishTripId, 'publish.visible': true }),
				Meteor.users.find({
					$or: [
						{ _id: publishedTrip.user },
						{ _id: publishedTrip.comrades.race }
					]
				})
			];
		}
	});

	Meteor.publish("mine-trips", function(){
		if(this.userId !== null)
			return Trips.find({
				$or: [
					{ user: this.userId },
					{$and: [{'comrades.race': this.userId}, {'publish.visible': true}]}
				]
			});
	});

	Meteor.publish("book-user-trips", function(bookId){
		bookId = parseInt(bookId);
		var book = Books.findOne({bookId: bookId});

		if(book !== undefined){
			return [
				Books.find({ bookId: bookId }),
				PublishedTrips.find({
					$or: [
						{ user: book.userId },
						{$and: [{'comrades.race': book.userId}, {'publish.visible': true}]}
					]
				}),
				Meteor.users.find({ _id: book.userId })
			];
		}
		else
			this.ready();
	});

	// Meteor.publish("book-user-profile", function(bookId){
	// 	bookId = parseInt(bookId);
	// 	var book = Books.findOne({bookId: bookId});

	// 	if(book !== undefined){
	// 		return Meteor.users.find(book.userId);
	// 	}
	// });

	Meteor.publish("official-races", function(){
		return Meteor.users.find({ 'profile.isRace': true });
	});

	// ~~~

	UploadServer.init({
		tmpDir: process.env.PWD + '/.uploads/tmp',
		uploadDir: process.env.PWD + '/.uploads/',
		checkCreateDirectories: true //create the directories for you
	});

	// ~~~

	if(Meteor.users.findOne({'emails.0.address': 'autostoprace1@no-reply.net'}) !== undefined)
		Meteor.call("MakeRace", Meteor.users.findOne({'emails.0.address': 'autostoprace1@no-reply.net'})._id, "Auto Stop Race - Chalkidiki - 2015", 1001);
	if(Meteor.users.findOne({'emails.0.address': 'autostoprace2@no-reply.net'}) !== undefined)
		Meteor.call("MakeRace", Meteor.users.findOne({'emails.0.address': 'autostoprace2@no-reply.net'})._id, "Wyścig Autostopem - Budapeszt - 2015", 1002);
	if(Meteor.users.findOne({'emails.0.address': 'autostoprace3@no-reply.net'}) !== undefined)
		Meteor.call("MakeRace", Meteor.users.findOne({'emails.0.address': 'autostoprace3@no-reply.net'})._id, "Mistrzostwa Autostopowe - Cesky Krumlov - 2015", 1003);
	if(Meteor.users.findOne({'emails.0.address': 'autostoprace4@no-reply.net'}) !== undefined)
		Meteor.call("MakeRace", Meteor.users.findOne({'emails.0.address': 'autostoprace4@no-reply.net'})._id, "Krakostop - Monaco - Isolabona - 2015", 1004);
	if(Meteor.users.findOne({'emails.0.address': 'autostoprace5@no-reply.net'}) !== undefined)
		Meteor.call("MakeRace", Meteor.users.findOne({'emails.0.address': 'autostoprace5@no-reply.net'})._id, "Polibośnia - Jajce - 2015", 1005);

	// ~~~

	Letters.remove({});

	var letters = {
		"afrikaans": "afrikaans.pdf",
		"gujarati": "gujarati.jpg",
		"punjabi": "punjabi.JPG",
		"albanski": "albanski.pdf",
		"hiszpański": "hiszpański.pdf",
		"rosyjski": "rosyjski.pdf",
		"angielski": "angielski.pdf",
		"holenderski": "holenderski.pdf",
		"serbski": "serbski.pdf",
		"arabski": "arabski.pdf",
		"indonezyjski": "indonezyjski.pdf",
		"słowacki": "słowacki.pdf",
		"azerski": "azerski.pdf",
		"japoński": "japoński.pdf",
		"słoweński": "słoweński.pdf",
		"bengalski": "bengalski.pdf",
		"katalonski": "katalonski.pdf",
		"swahili": "swahili.pdf",
		"białoruski": "białoruski.pdf",
		"kazachski": "kazachski.pdf",
		"szwedzki": "szwedzki.pdf",
		"bułgarski": "bułgarski.pdf",
		"kennada": "kennada.pdf",
		"tagalog (filipiny)": "tagalog(filipiny).pdf",
		"chiński uproszczony": "chińskisimplified.pdf",
		"koreański": "koreański.pdf",
		"tajski": "tajski.pdf",
		"chiński tradycyjny": "chińskitradycyjny.pdf",
		"litewski": "litewski.pdf",
		"tamil": "tamil.pdf",
		"chorwacki": "chorwacki.pdf",
		"łotewski": "łotewski.pdf",
		"turecki": "turecki.pdf",
		"czarnogórski": "czarnogórski.pdf",
		"macedoński": "macedoński.pdf",
		"turkmeński": "turkmeński.pdf",
		"czeski": "czeski.pdf",
		"malajski": "malajski.pdf",
		"ukraiński": "ukraiński.pdf",
		"dari": "dari.pdf",
		"marathi": "marathi.pdf",
		"uzbecki": "uzbecki.pdf",
		"estoński": "estoński.pdf",
		"niemiecki": "niemiecki.pdf",
		"walijski": "walijski.pdf",
		"farsi (iran)": "farsi(iran).pdf",
		"norweski": "norweski.pdf",
		"węgierski": "węgierski.docx.pdf",
		"finski": "finski.pdf",
		"oriya": "oriya.pdf",
		"wietnamski": "wietnamski.pdf",
		"francuski": "francuski.pdf",
		"ormiański": "ormiański.pdf",
		"włoski": "włoski.pdf",
		"grecki": "grecki.pdf",
		"polski": "polski.pdf",
		"gruziński": "gruziński.pdf",
		"portugalski": "portugalski.pdf"
	};

	for(var key in letters){
		var val = letters[key];

		var niceKey = key[0].toUpperCase() + key.slice(1);

		Letters.insert(new Letter(niceKey, "/letters/" + val));
	}

	Meteor.publish("letters-collection", function(){
		return Letters.find({});
	});
});