var should = require("should")
, connect = require("express/node_modules/connect")
, uid = connect.utils.uid
, md5 = connect.utils.md5
, assert = require("assert")
, app = require("../index.js")
, db = app.db
, users = db.users
, messages = db.messages
, clients = db.clients
, nodes = db.nodes
, testMsg = "It's a test msg"
, testUser = { 
	login: "testapiKvI"
	, name: "testapiKvI"
	, email: "t@t.com"
	, cryptedPassword: md5( "public" )
}
, user
, node;

genTestUser(function(u, n){
	user = u;
	node = n;
});

setTimeout(function() {
	db.close();
}, 3000);


function cleanData( fn ) {
	users.remove({login: testUser.login}, function(){
		nodes.remove({name: testUser.login + ".default"}, function(){
			messages.remove({msg: testMsg}, function(){
				clients.remove({id: "123456"}, function() {
					fn();
				});
			});
		});
	});
}

function genTestUser( fn ){
	cleanData(function(){
		users.insert(testUser, function(err, users){
			var _user = users[0];
			nodes.insert({
				name: _user.login + ".default"
				, apikey: "kkkkkkk"
				, label: "default"
				, user: _user.login
			}, function(err, doc){
				nodes.initRoster(doc[0], _user, function(err) {
					fn(_user, doc[0]);
				});
			});
		});
	});
}
function authStr (str) {
	str = (new Buffer(str || "", "ascii")).toString("base64");
	return "Basic " + str;
}

function JSONResponse(server, req, res, fn, msg){
	req.data = req.data && JSON.stringify( req.data );
	req.headers = req.headers || {};
	if( req.auth ) {
		req.headers["authorization"] = authStr( req.auth );
	}
	req.headers["content-type"] = "application/json";
	return assert.response( server, req, res, function(res){
		res.body = JSON.parse(res.body);
		fn(res);
	}, msg );
}

module.exports = {
	"auth": function(beforeExit) {
		setTimeout(function() {
			JSONResponse(app, {
				url: '/1/send_notification'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI:public"
			}, {
				status: 401
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1104);
				body.status.should.be.equal("error");
			}, "error user format");

			JSONResponse(app, {
				url: '/1/send_notification'
				, method: 'POST'
				, data: {}
				, auth: "tes.default:public"
			}, {
				status: 401
				, headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1104);
				body.status.should.be.equal("error");
			}, "not exist user");

			JSONResponse(app, {
				url: '/1/send_notification'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI.def:public"
			}, {
				status: 401
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1104);
				body.status.should.be.equal("error");
			}, "not exist node");

			JSONResponse(app, {
				url: '/1/send_notification'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI.default:public"
			}, {
				status: 401
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1101);
				body.status.should.be.equal("error");
			}, "auth error");

			JSONResponse(app, {
				url: '/1/send_notification'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI.default:kkkkkkk"
			}, {
				status: 403
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1102);
				body.status.should.be.equal("error");
			}, "require msg");

			JSONResponse(app, {
				url: '/1/register_client'
				, method: 'POST'
				, data: {}
				, auth: "tes:public"
			}, {
				status: 401
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1103);
				body.status.should.be.equal("error");
			}, "not exist user");

			JSONResponse(app, {
				url: '/1/register_client'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI:public1"
			}, {
				status: 401
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1101);
				body.status.should.be.equal("error");
			}, "auth error");

			JSONResponse(app, {
				url: '/1/register_client'
				, method: 'POST'
				, data: {}
				, auth: "testapiKvI:public"
			}, {
				status: 403
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(1102);
				body.status.should.be.equal("error");
			}, "require msg");

		}, 1000);
	}
	, "send": function(){
		setTimeout(function() {

			JSONResponse(app, {
				url: '/1/send_notification.json'
				, method: 'POST'
				, data: {msg: testMsg, uri: "testuri"}
				, auth: "testapiKvI.default:kkkkkkk"
			}, {
				status: 200
				, headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(2201);
				body.status.should.be.equal("success");
				messages.findOne({msg: testMsg, type: "notifcation"}, function(err, msg) {
					should.not.exist(err);
					should.exist(msg);
					msg.msg.should.be.equal(testMsg);
					msg.uri.should.be.equal("testuri");
					msg.node.should.be.equal(testUser.login + ".default");
					msg.nodeLabel.should.be.equal("default");
				});
			}, "send notifcation ok");

			JSONResponse(app, {
				url: '/1/send_status'
				, method: 'POST'
				, data: {msg: testMsg, uri: "testuri"}
				, auth: "testapiKvI.default:kkkkkkk"
			}, {
				status: 200
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(2201);
				body.status.should.be.equal("success");
				messages.findOne({msg: testMsg, type: "status"}, function(err, msg) {
					should.not.exist(err);
					should.exist(msg);
					msg.msg.should.be.equal(testMsg);
					msg.uri.should.be.equal("testuri");
				});
			}, "send status ok");

		}, 1500);

	}
	, "client": function() {
		setTimeout(function() {

			JSONResponse(app, {
				url: '/1/register_client'
				, method: 'POST'
				, data: {id: "123456", type: "ios", token: "55555", platform: "iphone"}
				, auth: "testapiKvI:public"
			}, {
				status: 200
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(2201);
				body.status.should.be.equal("success");
				clients.find({user: user.login}).toArray(function(err, _clients) {
					should.not.exist(err);
					should.exist(_clients);
				});
			}, "register client ok");

			JSONResponse(app, {
				url: '/1/register_client'
				, method: 'POST'
				, data: {id: "123456", type: "ios", token: "55555", platform: "iphone"}
				, auth: "testapiKvI:public"
			}, {
				status: 200
			}, function(res){
				var body = res.body;
				body.response_code.should.be.equal(2201);
				body.status.should.be.equal("success");
				clients.find({user: user.login}).toArray(function(err, _clients) {
					should.not.exist(err);
					should.exist(_clients);
					_clients.should.have.length(1);
					var client = _clients[0];
					client.id.should.be.equal("123456");
					client.type.should.be.equal("ios");
					client.token.should.be.equal("55555");
					client.platform.should.be.equal("iphone");

					JSONResponse(app, {
						url: '/1/del_client'
						, method: 'POST'
						, data: {id: "123456", type: "ios"}
						, auth: "testapiKvI:public"
					}, {
						status: 200
					}, function(res){
						var body = res.body;
						body.response_code.should.be.equal(2201);
						body.status.should.be.equal("success");
						clients.find({user: user.login}).toArray(function(err, _clients) {
							should.not.exist(err);
							should.exist(_clients);
							_clients.should.have.length(0);
						});
					}, "del client ok");
				});
			}, "dup register client");
		}, 2000);
	}
	, "message": function() {
		//setTimeout(function() {
		//	console.log(1);
		//	JSONResponse(app, {
		//		url: '/1/messages'
		//		, method: 'GET'
		//		, data: {}
		//		, auth: "testapiKvI:public"
		//	}, {
		//		//status: 200
		//	}, function(res){
		//		//var body = res.body;
		//		console.log(res.body);
		//		//body.response_code.should.be.equal(1101);
		//		//body.status.should.be.equal("error");
		//	}, "get messages");

		//}, 2500);
	}
}

