/*

algorytms.js

Zawiera użyteczne funkcje.

algorytm -- mała biblioteka do generowania numerów ksiażeczki

*/
algorythm = (function(){
	// NIE ZMIENIAĆ TEGO PO DEPLOYU
	var passpharse = "deployowa-generacja";
	var salt = "5-marca-2015-mójautostop";

	return {
		generateKey: function(bookId){
			var generatedKey = CryptoJS.HmacMD5(salt + bookId.toString(), passpharse).toString();

			var first = generatedKey.substr(0, 4);
			var second = generatedKey.substr(-4);
			var third = generatedKey.substr(4, 4);
			var fourth = generatedKey.substr(-4, 4);

			return first + "-" + second + "-" + third + "-" + fourth;
		},
		isMathing: function(bookId, key){
			return this.generateKey(bookId) === key;
		},
		generateKeys: function(start, count){
			console.log("=== START (" + start + ", " + count + ") ===");
			for(var i = start; i < (count + start); i++){
				console.log("\t" + i + "\t" + this.generateKey(i));
			}
			console.log("=== END ===");
		}
	};
})();