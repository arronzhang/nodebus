var should = require("should");
var auth = require("../lib/auth.js");

module.exports = {
	"basic": function() {

		auth.basic.test('Basic aGlkZGVuOnB1YmxpYw==').should.be.true;
		auth.basic.test('aGlkZGVuOnB1YmxpYw==').should.be.false;

		var param = auth.basic.parse('aGlkZGVuOnB1YmxpYw==');
		param.username.should.eql("hidden");
		param.password.should.eql("public");

		param = auth.basic.parse('aGlkZGVuOg==');
		param.username.should.equal("hidden");
		param.password.should.equal("");
	}
}
