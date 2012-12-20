/**
* http://en.wikipedia.org/wiki/Basic_access_authentication
*
* Authorization: Basic aGlkZGVuOnB1YmxpYw==
* WWW-Authenticate: Basic realm="Secure Area"
*
* http://en.wikipedia.org/wiki/Digest_access_authentication
* https://github.com/thedjinn/node-http-digest/blob/master/lib/http-digest.js
* https://github.com/gevorg/http-auth/blob/master/lib/http-auth.js
*
* Authorization: Digest username="Mufasa",
*                       realm="testrealm@host.com",
*                       nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
*                       uri="/dir/index.html",
*                       qop=auth,
*                       nc=00000001,
*                       cnonce="0a4f113b",
*                       response="6629fae49393a05397450978507c4ef1",
*                       opaque="5ccc069c403ebaf9f0171e9517f40e41"
*
* WWW-Authenticate: Digest realm="testrealm@host.com",
*                         qop="auth,auth-int",
*                         nonce="dcd98b7102dd2f0e8b11d0f600bfb0c093",
*                         opaque="5ccc069c403ebaf9f0171e9517f40e41"
//{"status":"error","response_code":1101,"response_message":"Invalid Credentials"}
*
*/

function decode64 (str) {
	return new Buffer(str, 'base64').toString('utf8');
}

function encode64 (str) {
	return new Buffer(str, 'utf8').toString('base64');
}

var basicReg = /^Basic\s/i;

var basic = { 
	test: function(str) {
		return !!str && basicReg.test(str);
	}
	, parse: function (str) {
		if( !str ) return null;
		str = decode64(str.replace(basicReg, "")).split(":");
		var name = str.shift();
		return { username:(name || "").trim(), password: (str.join(":") || "").trim() };
	}
};

module.exports = {
	basic: basic
};
