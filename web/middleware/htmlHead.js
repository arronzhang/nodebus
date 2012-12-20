/**
* res.title("")
* res.keywords([])
* res.description("")
*
*/


module.exports = function(siteName, title, keywords, description){

	var defaultKeyWords = keywords || [];
	return function htmlHead(req, res, next){
		res.title = localTitle;
		res.keywords = localKeyWords;
		res.description = localDescription;
		//Set default...
		res.title(title);
		res.keywords([]);
		res.description(description);
		next();
	}

	function localTitle(name) {
		this.local("title", (siteName || "") + (name ? " - " + name : "") );
	}

	function localKeyWords(names) {
		names = names ? ((typeof names == "string") ? [names] : names) : [];
		defaultKeyWords.forEach(function(key) {
			names.push(key);
		});
		this.local("keywords", names.join(",") );
	}

	function localDescription(content) {
		this.local("description", content );
	}
}
