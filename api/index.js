/** command line helper */
var optimist = require('optimist')
.default('h', '0.0.0.0')
.alias('h', 'host')
.describe('h', 'Server host')
.default('p', '3000')
.alias('p', 'port')
.describe('p', 'Server port')
.describe('help', 'Show help')
.usage("Usage: -h [host] -p [port]");

var argv = optimist.argv;
if( argv.help ) {
	optimist.showHelp();
	process.exit(1);
}

/** deps */
var express = require("express")
, colors = require("colors")
, connect = require("express/node_modules/connect")
, uid = connect.utils.uid
, md5 = connect.utils.md5
, auth = require("./lib/auth.js")
, app = express.createServer();

/** db */
var db = require("../web/db.js")
, users = db.users
, session = db.session
, nodes = db.nodes
, roster = db.roster
, messages = db.messages
, clients = db.clients;

/** config */
app.use(express.methodOverride());
app.use(express.bodyParser());
//app.use(express.cookieParser());
app.use(function realIp(req, res, next){
	/**Get real ip from nginx proxy. */
	req.socket.remoteAddress = req.headers['x-real-ip'] || req.socket.remoteAddress;
	next();
});

app.use(function disguiseHeader(req, res, next){
	res.setHeader("X-Powered-By", "PHP/5.2.5");
	next();
});

var errors = {
	"system": [500, { "status": "error", "response_code": 1100, "response_message": "An error occurred" }]
	, "auth": [401, { "status": "error", "response_code": 1101, "response_message": "Invalid Credentials" }]
	, "param": [403, { "status": "error", "response_code": 1102, "response_message": "Missing required parameters" }]
	, "user": [401, { "status": "error", "response_code": 1103, "response_message": "No such user" }]
	, "node": [401, { "status": "error", "response_code": 1104, "response_message": "No such node" }]
};;

var success = { "status": "success", "response_code": 2201, "response_message": "OK" };

app.use(function response(req, res, next){
	//require("url").parse(req.url).pathname

	res.success = function (data){
		var out = success;
		if( data ) {
			out = {};
			for( var key in success ) {
				out[key] = success[key];
			}
			out.response_data = data;
		}
		res.json( out );
	};
	res.error = function (type){
		res.statusCode = errors[type][0];
		res.json( errors[type][1] );
	};
	next();
});

app.use(express.logger({ format: "Started " + ":method".underline + " " + ":url".green + " for :remote-addr at :date Completed :status in " + ":response-time ms".yellow }));
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

/* router */

function authenticateNode(req, res, next){
	var param = auth.basic.parse( req.headers["authorization"] );
	var name = param && param.username;
	if( !param || !param.username ) {
		res.error("param");
	}else{
		nodes.findOne({name: param.username}, function(err, node){
			if( err ) {
				res.error("system");
			}
			else if( !node ) {
				res.error("node");
			} else if( node.apikey == param.password ) {
				req.node = node;
				next();
			} else {
				res.error("auth");
			}
		});
	}
}

function authenticateUser(req, res, next){
	var param = auth.basic.parse( req.headers["authorization"] );
	if( !param || !param.username ) {
		res.error("param");
	}else{
		users.findOne({login: param.username}, function(err, user) {
			if( err ) {
				res.error("system");
			}
			else if( !user ) {
				res.error("user");
			}
			else if(user && md5(param.password) == user.cryptedPassword) {
				req.user = user;
				next();
			} else {
				res.error("auth");
			}
		});
	}
}

app.get('/', function(req, res) {
	res.success();
});

app.post('/1/send_notification.:format?', authenticateNode, function(req, res){
	var body = req.body
	, msg = body.msg
	, uri = body.uri
	, title = body.title;
	if(!msg){
		res.error("param");
	} else {
		var message = {
			msg: msg
			, type: "notification"
			, createdAt: new Date()
		};
		if( uri ) {
			message.uri = uri;
		}
		if( title ) {
			message.title = title;
		}
		nodes.createMessage(req.node, message)
			.done(function(message) {
				res.success();
			})
			.fail( function() {
				res.error("system");
			} );
	}
});

app.post('/1/send_status.:format?', authenticateNode, function(req, res){
	var body = req.body
	, msg = body.msg
	, uri = body.uri
	, title = body.title;
	if(!msg){
		res.error("param");
	} else {
		var message = {
			msg: msg
			, type: "status"
			, createdAt: new Date()
		};
		if( uri ) {
			message.uri = uri;
		}
		if( title ) {
			message.title = title;
		}
		nodes.createMessage(req.node, message)
			.done(function(message) {
				res.success();
			})
			.fail( function() {
				res.error("system");
			});
	}	
});

app.post("/1/register_client.:format?", authenticateUser, function(req, res) {
	var body = req.body;
	if( !body.id || !body.type || !body.token ) {
		res.error("param");
	} else {
		//update client
		var user = req.user
		, client = {
			id: body.id
			, type: body.type
			, user: user.login
			, token: body.token
			, desc: body.desc
			, platform: body.platform
			, updatedAt: new Date()
		};
		clients.update({type: body.type, id: body.id}, {$set: client}, {upsert:true, safe: true}, function(err, count){
			if( err ) {
				res.error("system");
			} else {
				res.success();
			}
		});
	}
});

app.post("/1/del_client.:format?", authenticateUser, function(req, res) {
	var body = req.body;
	if( !body.id || !body.type ) {
		res.error("param");
	} else {
		//remove client
		var client = {user: req.user.login, type: body.type, id: body.id};
		clients.remove(client, function(err, count){
			if( err ) {
				res.error("system");
			} else {
				res.success();
			}
		});
	}
});

app.get("/1/messages.:format?", authenticateUser, function(req, res) {
	var body = req.query
	, count = parseInt(body.count) || 10
	, sinceId = body.since_id
	, maxId = body.max_id
	, page = parseInt(body.page) || 1
	, skip
	, query = {}
	, options = {};
	if( count > 50 || count < 1 ) {
		count = 10;
	}

	if(sinceId){
		try{
			sinceId = db.ObjectID(sinceId);
		}catch(e){
			sinceId = null;
		}
	}

	if(maxId){
		try{
			maxId = db.ObjectID(maxId);
		}catch(e){
			maxId = null;
		}
	}

	page = page < 1 ? 1 : page;
	skip = (page - 1) * count;

	if( sinceId ) {
		query._id = query._id || {};
		query._id["$gt"] = sinceId;
	}
	if( maxId ) {
		query._id = query._id || {};
		query._id["$lte"] = maxId;
	}
	users.nodes(req.user)
		.done(function(nodes) {
			if ( !query.node ) {
				query.node = nodes.length ? {"$in": nodes.map(function(n){return n.name}) } : null;
			}
			messages.find(query).skip(skip).limit(count).sort({_id: -1}).toArray(function(err, messages) {
				if( err ) {
					res.error("system");
				} else {
					//api format
					messages = messages.map(function(message) {
						var msg = {
							id: message._id
						  , msg: message.msg
						  , uri: message.uri
						  , title: message.title
						  , type: message.type == "notification" ? "notification" : "status"
						  , nodeName: message.node
						  , nodeLabel: message.nodeLabel
						  , createdAt: message.createdAt
						};
						return msg;
					});
					res.success(messages);
				}
			});
		})
		.fail( function() {
			return res.error("system");
		});
});

module.exports = app;
app.db = db;

if( !module.parent ) {
	app.listen( Number(argv.p), argv.h );
	console.log( "Express %s application starting in %s on %s:%d at %s", express.version, app.settings.env, argv.h, argv.p, new Date().toLocaleString() );
}
