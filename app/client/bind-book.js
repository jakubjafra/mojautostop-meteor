Template.BindBook.events({
	'click #book_submit': function(event){
		var bookId = $("#book_id").val();
		var bookKey = $("#book_key").val();

		Meteor.call("BindBook", bookId, bookKey, function(error, result){
			if(!result)
				alert("błąd walidacji - czy na pewno podałeś odpowiedni klucz?");
			else
				alert("powiązano książeczkę");
		});
	}
});