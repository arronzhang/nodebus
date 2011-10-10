var should = require("should");
var app = require("../index.js");

module.exports = {
	"truncate": function() {
		app.truncate("test").should.be.equal("test");
		Buffer.byteLength(app.truncate(Array(300).join("测"))).should.be.below(81);
	}
}
