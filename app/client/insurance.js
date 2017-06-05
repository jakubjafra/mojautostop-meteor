Template.InsuranceForm.onRendered(function(){
	Template.instance().$('.input-daterange').datepicker({
		format: "yyyy-mm-dd",
		language: "pl"
	});
});

Template.InsuranceForm.events({
	'click #form-submit': function(event){
		event.preventDefault();

		var data = {};

		Template.instance().$('[name]').toArray().forEach(function(item){
			data[$(item).attr('name')] = $(item).val();
		});

		Meteor.call('SendInsuranceEmail', data);

		alert("Twoje zgłoszenie zostało wysłane. Poczekaj, aż ubezpieczyciel zapozna się z twoją sprawą i odpisze na podany w formularzu adres email.");

		return false;
	}
});