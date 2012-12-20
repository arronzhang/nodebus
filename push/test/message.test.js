
var mailer = require("nodemailer")
, should =require("should")
, message = require("../plugins/message")
, db = message.db
, users = db.users
, nodes = db.nodes
, clients = db.clients
, messages = db.messages


mailer.SMTP = {
	host : "localhost"              // smtp server hostname
	, port : "25"                     // smtp server port
};

function genUser (callback) {
	users.update({login: "testmail"}, {$set: {name: "mail"}}, {upsert:true, safe:true}, function() {
		users.findOne({login: "testmail"}, function(err, user) {
			nodes.update({user: user.login, name: "testmail.default"}, {$set: {apikey: "public", label: "default"}}, {upsert:true, safe:true}, function() {
				nodes.findOne({name: "testmail.default"}, function(err, node) {
					db.nodes.initRoster(node, user, function() {
						callback(user, node);
					});
				});
			});
		});
	});
}

var testMailFrom = "\"中文\" <hidden@local.com>";
var testMailTitle = "node_mailer 中间中文test email";
var testMailMsg = "Test for chinese\n人民网10月20日电 （安国章） 据来自利比亚的消息，\n利比亚执政当局部队今天已经完全控制了卡扎菲的老家苏尔特，卡扎菲两腿受伤后被逮捕，已被送往医院。 据利比亚电视台报道，利比亚执政当局的部队今天清晨对卡 ...";

function sendMail (user, callback, andHtml) {
	// body...
	mailer.send_mail({
		//ssl: true,                        // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
		domain : "hidden.com",            // domain used by client to identify itself to server
		to : "\"Hidden\" <" + user + "@push.nodebus.com>",
		sender: testMailFrom,
		subject : testMailTitle,
		body: testMailMsg,
		html: andHtml ? ('<p>'+testMailMsg+'</p>') : undefined
	},
	function(err, result){
		callback(err, result);
	});
}

module.exports = {
	parseAuthStr: function() {
		var user = message.parseAuthStr("hidden.default-public");
		user.should.have.length(2);
		user[0].should.be.equal("hidden.default");
		user[1].should.be.equal("public");

		user = message.parseAuthStr("hidden.default.1-public-1");
		user[0].should.be.equal("hidden.default.1");
		user[1].should.be.equal("public-1");

	}
	, send: function() {
		genUser(function(user, node) {
			user.login.should.be.equal("testmail");
			node.name.should.be.equal("testmail.default");
			sendMail("test", function(err, succ) {
				should.exist(err);
			});
			sendMail("testmai.defaul", function(err, succ) {
				should.exist(err);
			});
			sendMail("testmail.defaul", function(err, succ) {
				should.exist(err);
			});
			sendMail("testmail.default-p", function(err, succ) {
				should.exist(err);
				messages.remove({node: node.name}, function() {
					sendMail("testmail.default-public", function(err, succ) {
						should.not.exist(err);
						succ.should.be.true;
						messages.find({node: node.name}).toArray(function(err, msgs) {
							should.exist(msgs);
							msgs.should.have.length(1);
							var msg = msgs[0];
							msg.uri.should.be.equal(testMailFrom);
							msg.title.should.be.equal(testMailTitle);
							msg.msg.should.be.equal(testMailMsg);
							//With html
							sendMail("testmail.default-public", function(err, succ) {
								messages.find({node: node.name}).toArray(function(err, msgs) {
									should.exist(msgs);
									msgs.should.have.length(2);
									db.close();
								});
							}, true);
						});
					});
				});
			});
		});
	}
};

