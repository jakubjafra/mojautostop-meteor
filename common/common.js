/*

common.js

*/

Trip = function(name, userId){
	this.name = name;
	this.user = userId;
	this.points = [];
};

RoutePoint = function(name, lat, lon){
	this.name = name;
	this.lat = lat;
	this.lon = lon;
};

Trips = new Mongo.Collection("trips");