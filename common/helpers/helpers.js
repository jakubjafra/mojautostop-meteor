__isProd = function(){
	return Meteor.absoluteUrl() === "http://localhost:3000/";
}

__isDev = function(){
	return !__isProd();
}