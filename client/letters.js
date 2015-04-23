CurrLetter = new ReactiveVar("");

Template.Letters.helpers({
	'letters': function(){
		return Letters.find({});
	},
	'showCurrentLetter': function(){
		return CurrLetter.get().length > 0;
	},
	'currentLetterPath': function(){
		return CurrLetter.get();
	}
});

Template.Letters.events({
	'change #choose-language': function(){
		CurrLetter.set($("#choose-language").val());
	}
});