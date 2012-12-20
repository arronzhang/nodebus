
var mongoq = require("mongoq")
  , dbUrl = "mongodb://localhost:27200/nodebus?auto_reconnect=true"
  , db = mongoq(dbUrl)
  , ObjectID = db.ObjectID = mongoq.BSON.ObjectID
  , sessionStore = db.sessionStore = new mongoq.SessionStore( db.collection("sessions") )
  , users = db.users = db.collection("users")
  , nodes = db.nodes = db.collection("nodes")
  , roster = db.roster = db.collection("roster")
  , messages = db.messages = db.collection("messages")
  , metrics = db.metrics = db.collection("metrics")
  , clients = db.clients = db.collection("clients")
  , queue = db.queue = db.collection("queue", {
	  capped: true
	, max: 4096
	, size: 4096 * 8192
	, autoIndexId: true
	})
  , connect = require("express/node_modules/connect")
  , uid = connect.utils.uid
  , util = require("util")
  , md5 = connect.utils.md5;

/** clean old index..*/
//nodes.dropIndex("user_1_name_1", function() {});
//messages.dropIndex("user_1_node_1", function() {});
//messages.dropIndex("users_1_node_1", function() {});
/** db index */

db.on("error", function() {
	console.log("db on error");
	console.log(arguments);
});

db.helper = function(cName, methods) {
	var col = db[cName] = db[cName] || db.collection( cName );
	if( methods ) {
		for( var key in methods ) {
			col[ key ] = methods[ key ];
		}
	}
	return col;
};

users.ensureIndex({login: 1}, {unique: true}, function() {});

nodes.ensureIndex({name: 1}, {unique: true}, function() {});

messages.ensureIndex({node: 1}, {}, function() {});
messages.ensureIndex({createAt: -1}, {}, function() {});
roster.ensureIndex({user: 1, jid: 1}, {unique: true}, function() {});

//One device for one user.
clients.ensureIndex({type: 1, id: 1}, {unique: true}, function() {});
clients.ensureIndex({user: 1, type: 1, id: 1}, {}, function() {});

queue.ensureIndex({out: 1, type: 1, ts: 1}, {}, function() {});

metrics.ensureIndex({n: 1, s: 1, ts: 1}, {}, function() {});

module.exports = db;

/*helpers*/

/*
 * Generate id
 * @param Object doc   node or user
 * @param Boolean isJid
 * @return String id
 *
 */

function genId(doc, isJid){
	return (doc.login ? doc.login : doc.name) +  (isJid ? "@nodebus.com" : ""); 
}


/*
 * Generate id
 * @param String id
 * @return Array [login] or [user,node]
 */

function parseId(id){
	return id && id.split ? id.split("@")[0] : "";
}

db.helpers = {
	genId: genId
  , parseId: parseId
};

/* nodes */
nodes.destory = function (node) {
	return db.roster.remove({ $or: [ { jid: genId(node, true) }, { user: genId( node ) }] })
		.and( function() {
			return db.nodes.remove({ name: node.name });
		} )
		.and( function() {
			return db.messages.remove({ node: node.name });
		} );
};

nodes.initRoster = function(node, user) {
	return roster.insert([{
		"user" : node.user
	  , "jid" : genId(node, true)
	  , "name" : node.label
	  , "sub" : "both"
	  , "ask" : "none"
	}, {
		"user" : genId(node)
	  , "jid" : node.user + "@nodebus.com"
	  , "name" : user.name
	  , "sub" : "both"
	  , "ask" : "none"
	}, {
		"user" : genId(node)
	  , "jid" : "event.nodebus.com"
	  , "name" : "event"
	  , "sub" : "both"
	  , "ask" : "none"
	  , "service": true
	}, {
		"user" : genId(node)
	  , "jid" : "status.nodebus.com"
	  , "name" : "status"
	  , "sub" : "both"
	  , "ask" : "none"
	  , "service": true
	}]);
}

nodes.initMetricRoster = function(node, user) {
	return roster.insert([{
		"user" : genId(node)
	  , "jid" : "metric.nodebus.com"
	  , "name" : "metric"
	  , "sub" : "both"
	  , "ask" : "none"
	  , "service": true
	}]);
}

nodes.rename = function(node) {
	return nodes.update({name: node.name}, {$set: {label: node.label}}, {upsert:true, safe: true})
		.and( roster.update({jid: genId(node, true)}, {$set: {name: node.label} }, {upsert: true, safe: true}) );
};

/**
 * return users
 *
 */
nodes.users = function(node) {
	var id = typeof node == "string" ? node : node.name;
	return roster.find({user: id}, {jid: 1, name: 1, service: 1}).toArray()
		.next( function( docs ) {
			docs = docs.filter(function(doc) {
				return !doc.service;
			});
			return docs.map(function(doc) {
				return {login: parseId(doc.jid), name: doc.name};
			});
			return docs;
		});
};

/** users */

users.genDefaultNode = function(user){
	var node = {
		user: user.login
	  , name: user.login + ".default"
	  , label: "默认节点"
	  , apikey: uid(8).toLowerCase()
	  , createdAt: new Date()
	};
	return nodes.insert(node)
		.and( function( docs ) {
			nodes.initRoster(node, user);
		} );
}

users.follow = function(user, node) {
	return roster.insert([{
		"user" : genId(user)
	  , "jid" : genId(node, true)
	  , "name" : node.label
	  , "sub" : "both"
	  , "ask" : "none"
	}, {
		"user" : genId(node)
	  , "jid" : genId(user, true)
	  , "name" : user.name
	  , "sub" : "both"
	  , "ask" : "none"
	}])
		.done( function(docs) {
			queue.in("roster", {user: user.login, node: node.name});
		});
};

users.unfollow = function(user, node) {
	return roster.remove({ $or: [{
		"user" : genId(user)
	  , "jid" : genId(node, true)
	}, {
		"user" : genId(node)
	  , "jid" : genId(user, true)
	} ]})
		.done( function(docs) {
			queue.in("roster", {user: user.login, node: node.name, sub: "unfollow"});

		} );
};

users.nodes = function(user) {
	var id = typeof user == "stirng" ? user : user.login;
	return roster.find({user: id}, {user: 1, jid: 1, name: 1}).toArray()
		.next(function(docs) {
			var ids = docs.map(function(doc) {
				return parseId(doc.jid);
			});
			return nodes.find( {name: {"$in": ids} } ).sort({presence: 1, show: -1}).toArray();
		});
};

users.node = function(user, node) {
	return user.login == node.user ? 
		nodes.findOne({name: node.name}) :
		roster.findOne({user: user.login, jid: genId(node, true)})
		.next(function(n) {
			return n && nodes.findOne({name: node.name});
		});
}

nodes.createMessage = function(node, message) {
	message.node = node.name;
	message.nodeLabel = node.label;
	return messages.insert( message )
		.next(function(msgs) {
			return msgs && msgs[0];
		});
};

/** queue 
 * { type msg out ts }
 * queue.in
 * queue.out
 * queue.loop("router", function(err, messages, next){
 * 	next();
 * });
 */

queue.in = function(type, msg) {
	msg = (util.isArray(msg) ? msg : [msg]).map(function(m) {
		return {
			out: false
		  , type: type
		  , msg: m
		  , ts: new Date()
		};
	});
	return queue.insert(msg, {safe: true});
};

queue.out = function(type) {
};

queue.loop = function(type) {
};

