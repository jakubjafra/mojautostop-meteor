var endpoints = [];

Template.UploaderContainer.onCreated(function(){
	console.log(Uploader);
	Uploader.init(this);
});

Template.UploaderContainer.onRendered(function(){
	Uploader.render.call(this);

	var templateInstance = Template.instance();
	templateInstance.$('input[type="file"]').change(function(e){
		Uploader.startUpload.call(templateInstance, e);
	});

	Uploader.finished = function(index, fileInfo, context){
		endpoints.forEach(function(item){
			item.call(undefined, fileInfo.url);
		});
	};
});

addUploaderEndPoint = function(callback){
	endpoints.push(callback);
};