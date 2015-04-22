if(__isProd()){
	Accounts.config({
		forbidClientAccountCreation: true
	});
} else {
	Accounts.config({
		forbidClientAccountCreation: false
	});
}