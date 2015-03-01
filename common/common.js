/*

common.js

*/

Trip = function(name, userId){
	// nazwa tripa
	this.name = name;

	// id użytkownika-właściciela
	this.user = userId;

	// punkty na trasie
	this.points = [];

	// statystyki generowane przez serwer
	this.stats = {
		// dlugość w km
		distance: 0
	};
};

// point.id != point._id
RoutePoint = function(name){
	// id (w sumie nie wiem dlaczego...)
	this.id = CryptoJS.SHA1(name + (new Date).getTime()).toString();

	// link do trasy między tym punktem a kolejnym. Trasa jest opisana jako
	// lista punktów połaczona trasami, coś jakby punkt był głową węża który ugryzł
	// innego węża (P---P---P---P--- ...)
	this.route = new Route(this.id, null);

	// nazwa geograficzna punktu (np. nazwa miasta)
	this.name = name;

	// dane o punkcie:
	this.type = "normal";

	// ile się czekało w danym punkcie
	this.waitingTime = null;

	// statystyki generowane przez serwer
	this.stats = {
		countryCode: ""
	};
};

Route = function(beginId, endId){
	// punkt początkowy
	this.beginId = beginId;

	// punkt końcowy
	this.endId = endId;

	// statystki generowane przez serwer
	this.stats = {
		// długość w km
		distance: 0,

		// długość trasy w poszczególnych krajach przez które trasa przechodzi
		// elementy mają postać: { countryCode: "PL", distance: 0 }
		countries: []
	};

	// directions generowane przez google maps przy edycji tripa
	this.gmap_directions = [];
};

Trips = new Mongo.Collection("trips");