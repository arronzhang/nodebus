var should = require("should")
, db = require("../db.js");

setTimeout(function() {
	console.log("ok");
	db.close();
}, 1000);

module.exports = {
	"genId": function() {
		var genId = db.helpers.genId;

		genId({login: "hidden"}).should.be.eql("hidden");
		genId({login: "hidden"}, true).should.be.eql("hidden@nodebus.com");
		genId({user: "hidden", name: "hidden.default"}).should.be.eql("hidden.default");
		genId({user: "hidden", name: "hidden.default"}, true).should.be.eql("hidden.default@nodebus.com");
	}
	, "parseId": function() {
		var parseId = db.helpers.parseId;

		parseId().should.be.eql("");
		parseId("hidden").should.be.eql("hidden");
		parseId("hidden@nodebus.com").should.be.eql("hidden");
		parseId("hidden.default").should.be.eql("hidden.default");
		parseId("hidden.default@nodebus.com").should.be.eql("hidden.default");
	}
	, "roster": function(beforeExit) {
		var users = db.users
		, hadOpen = false
		, testUsers = [{
			login: "test842442"
			, name: "Test"
		}, {
			login: "test842443"
			, name: "Test"
		}]
		, user = testUsers[0]
		, user1 = testUsers[1];
		//Index...
		users.insert(testUsers, function() {
			users.find({login: user.login}).toArray(function(err, docs) {
				docs.should.have.length(1);
				docs[0].login.should.be.equal(user.login);

				users.genDefaultNode(user, function(err) {
					users.nodes(user, function(err, docs) {
						docs.should.have.length(1);
						var node = docs[0];
						node.name.should.be.equal("test842442.default");
						node.label = "Test1231" + Math.random();
						//rename...
						db.nodes.rename(node, function(err) {
							should.not.exist(err);
							db.roster.findOne({user: user.login}, function(err, doc) {
								should.exist(doc);
								doc.name.should.be.equal(node.label);
								//follow...
								users.follow(user1, node, function(err) {
									users.nodes(user1, function(err, docs) {
										should.not.exist(err);
										docs.should.have.length(1);
										hadOpen = true;
									});
								});
							});
						});
					});
				});
			});
		});

		beforeExit(function() {
			hadOpen.should.be.true;
		});
	}
};
