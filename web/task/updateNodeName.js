var crypto = require('crypto')
, db = require("../db.js")
, login = process.argv[2];

db.nodes.find().toArray(function(err, docs) {
	console.log("Nodes");
	docs.forEach(function(doc) {
		if( doc.name.indexOf(".") == -1 ) {
			console.log(doc.user + "." + doc.name);
			db.nodes.update({_id: doc._id}, {$set: {name: doc.user + "." + doc.name}}, {upsert: true}, function() {});
		}
	});
});


db.messages.find().toArray(function(err, docs) {
	console.log("Messages");
	docs.forEach(function(doc) {
		if( !doc.users ) {
			console.log(doc.user + "." + doc.node);
			db.messages.update({_id: doc._id}, {$set: {node: doc.user + "." + doc.node, users: [doc.user]}}, {upsert: true}, function() {});
		}
	});
});
