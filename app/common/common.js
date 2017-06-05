/*

common.js

*/

NO_GMAP_POINTS = 1;

Description = function(){
	// opis
	this.text = "";

	// ścieżki do wgranych zdjęć na serwerze
	this.pictures = [];
}

Trip = function(name, userId){
	// nazwa tripa
	this.name = name;

	// id użytkownika-właściciela
	this.user = userId;

	// parowanie (lista sparowanych użytkowników)
	this.comrades = {
		// user: null,
		race: null
	};

	// czy został upubliczniony
	this.publish = {
		// czy jest widoczny?
		visible: false,

		// id PublishTrip
		id: null,

		// czy jest przetwarzany
		isProcessing: false
	};

	// punkty na trasie
	this.points = [];

	// statystyki generowane przez serwer
	this.stats = {
		// dlugość w km
		distance: 0
	};

	// początek tripa (timestamp)
	this.beginTime = 0;

	// koniec tripa (timestamp)
	this.endTime = 0;

	// czas utworzenia
	this.createdAt = (new Date()).getTime();
};

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

	// statystyki generowane przez serwer
	this.stats = {
		countryCode: ""
	};

	// opis punktu
	this.desc = new Description();
};

Route = function(beginId, endId){
	// punkt początkowy
	this.beginId = beginId;

	// punkt końcowy
	this.endId = endId;

	// ile się czekało na początku w punkcie
	this.waitingTime = null;

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

	// opis punktu
	// this.desc = new Description();
};

// ~~~

Book = function(id, userId){
	// ID książeczki (1, 2, 3...)
	this.bookId = parseInt(id);

	// identyfikator użytkownika
	this.userId = userId;
};

// ~~~

UserProfile = function(){
	// czy zakupił książeczkę
	this.isPremium = false;

	// link do profilu
	this.premiumBookId = null;

	// specjalna flaga oznaczająca wyścig autostopowy
	this.isRace = false;

	// imię i nazwisko
	this.firstName = "";
	this.lastName = "";

	// np. nazwa bloga, podróznika, nick
	this.specialNick = "";
	
	// link do bloga, facebooka etc.
	this.specialUrl = "";

	// zdjęcie profilowe
	this.photo = "/default_profile_photo.jpg";
};

// ~~~

NewsletterApplication = function(email){
	this.email = email;
};

// ~~~

Letter = function(name, fileName){
	this.name = name;
	this.fileName = fileName;
};

// ~~~

Trips = new Mongo.Collection("trips");
PublishedTrips = new Mongo.Collection("public_trips");

RemovedTrips = new Mongo.Collection("removed_trips");

Books = new Mongo.Collection("books");

Newsletter = new Mongo.Collection("newsletter");

Letters = new Mongo.Collection("letters");

InsuranceEmails = new Mongo.Collection("insurance_emails");