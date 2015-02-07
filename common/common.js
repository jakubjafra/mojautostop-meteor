/*

common.js

*/

Trip = function(name, userId){
	this.name = name;
	this.user = userId;
	this.points = [];
};

RoutePoint = function(name, lat, lon){
	this.id = CryptoJS.SHA1(name).toString();
	this.name = name;
	this.lat = lat;
	this.lon = lon;
};

Trips = new Mongo.Collection("trips");