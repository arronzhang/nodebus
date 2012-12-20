
var express = require("express")
, colors = require("colors")
, app = express.createServer();

app.use(express.methodOverride());
app.use(express.bodyParser());

var errors = {
	"system": [500, { "status": "error", "response_code": 1100, "response_message": "An error occurred" }]
	, "auth": [401, { "status": "error", "response_code": 1101, "response_message": "Invalid Credentials" }]
	, "param": [403, { "status": "error", "response_code": 1102, "response_message": "Missing required parameters" }]
	, "user": [401, { "status": "error", "response_code": 1103, "response_message": "No such user" }]
	, "node": [401, { "status": "error", "response_code": 1104, "response_message": "No such node" }]
};


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

function client(req, res){
	console.log(req.headers);
	console.log(req.body);
	console.log(req.query);
	//res.error("param");
	res.success();
}

app.post('/1/register_client.:format?', client);
app.get('/1/register_client.:format?', client);
app.post('/1/del_client.:format?', client);
app.get('/1/del_client.:format?', client);

var message = {
	id: "1"
	, msg: "Test"
	, uri: undefined
	, type: "notification"
	, node: "default"
	, nodeLabel: "default"
	, createdAt: null
};

function genMsg(id) {
	var r = parseInt(Math.random() * 100000);
	var t = r % 2 ? "notification" : "status";
	return {
		id: id
		, msg: "["+id+"] I'm "+ t + ( r % 2 ? "with long long long long long long long long text":"") +". " +  r
		, type: t
		, uri: null
		, node: "default"
		, nodeLabel: "default"
		, createdAt: new Date()
	}
};

app.get('/1/messages.:format?', function(req, res){
	var query = req.query;
	messages = [];
	//load more
	if( query.max_id ) {
		messages.push(genMsg("more"));
	} else if( query.since_id ) {
		messages.push(genMsg("new"));
	} else {
		var count = parseInt(query.count) || 20;
		for (var i = 0; i < 20; i++) {
			messages.push(genMsg("msg" + i));

		};
	}
	res.success(messages);
});

if( !module.parent ) {
	app.listen( 3000 );
	console.log( "Express %s application starting on %s:%d at %s", express.version, app.address().address, app.address().port, new Date().toLocaleString() );
}
