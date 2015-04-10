__isDev = function(){
	return Meteor.absoluteUrl() === "http://localhost:3000/";
}

__isProd = function(){
	return !__isDev();
}