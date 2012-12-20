if ( process.argv.length < 3 ){
	console.log("Useage: node genRouter.js login");
	process.exit();
}

var crypto = require('crypto')
  , db = require("../db.js")
  , login = process.argv[2]
  , includeMetrc = process.argv[3];

db.users.findOne({login: login}, function(err, user) {
	if( !user ) {
		console.log("User is not exist.");
	} else {
		db.nodes.find({user: login}).toArray(function(err, docs) {
			docs.forEach(function(node) {
				db.nodes.initRoster(node, user).done(function(res) {
					if ( includeMetrc ) {
						db.nodes.initMetricRoster(node, user);
					}
					console.log(user.login + "." + node.name);
				});
			});
		});
	}
});

