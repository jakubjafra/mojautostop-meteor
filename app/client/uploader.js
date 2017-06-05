var endpoints = [];

Template.UploaderContainer.onCreated(function(){
	Uploader.init(this);
});

var oldHTML = "";

Template.UploaderContainer.onRendered(function(){
	Uploader.render.call(this);

	console.log(Uploader);

	var templateInstance = Template.instance();
	templateInstance.$('input[type="file"]').change(function(e){
		oldHTML = templateInstance.$('div.fileUpload.btn.btn-default > span.text').html();
		templateInstance.$('div.fileUpload.btn.btn-default > span.text').html("Ładowanie zdjęcia...");
		Uploader.startUpload.call(templateInstance, e);
	});

	Uploader.formatProgress = function(file, progress, bitrate){
		console.log(file, progress);
	};

	Uploader.finished = function(index, fileInfo, context){
		templateInstance.$('div.fileUpload.btn.btn-default > span.text').html(oldHTML);
		endpoints.forEach(function(item){
			if(item.name === templateInstance.data.callbackName)
				item.callback.call(undefined, fileInfo.url);
		});
	};
});

addUploaderEndPoint = function(callbackName, callback){
	endpoints.push({name: callbackName, callback: callback});
};