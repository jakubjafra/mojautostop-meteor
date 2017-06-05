(function(){
	UI.registerHelper("valueify", function(obj){
	    result = [];
	    for (var key in obj){
	        result.push({name:key,value:obj[key]});
	    }
	    return result;
	});
})();

// window.fbAsyncInit = function(){
// 	console.log("FBINIT");
// 	FB.init({
// 		appId      : '1421996818107296',
// 		status     : true,
// 		xfbml      : true,
// 		version    : 'v2.3'
// 	});
// };