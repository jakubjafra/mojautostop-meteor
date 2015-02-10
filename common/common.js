/*

common.js

*/

Trip = function(name, userId){
	this.name = name;
	this.user = userId;
	this.points = [];
};

RoutePoint = function(name, type){
	this.id = CryptoJS.SHA1(name + (new Date).getTime()).toString();
	this.name = name;
	this.type = type;
};

Trips = new Mongo.Collection("trips");