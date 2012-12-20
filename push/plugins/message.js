var DSN = require('Haraka/dsn');

/** db */
var db = require(__dirname + "/../../web/db.js")
, users = db.users
, nodes = db.nodes
, clients = db.clients
, messages = db.messages;

function parseAuthStr (str) {
	str = (str || "").split("-");
	var str2 = (str.shift() || "");
	return [(str2 || "").trim().toLowerCase(), (str.join("-") || "").trim().toLowerCase()];
}

exports.parseAuthStr = parseAuthStr;
exports.db = db;

exports.hook_rcpt_ok = function (next, connection, address) {
	var self = this;
	var ar = parseAuthStr(address.user);
	if( !ar[0] || !ar[1] ) {
		return next(DENY, DSN.addr_bad_dest_syntax());
	}
	nodes.findOne({name: ar[0]}, function(err, node) {
		if( err ){
			return next(DENY, DSN.sys_unspecified());
		}
		if( !node || (node.apikey && node.apikey.toLowerCase() != ar[1]) ){
			return next(DENY, DSN.no_such_user());
		}
		self.__node = node;
		next();
	});
};

exports.hook_data = function (next, connection) {
	// enable mail body parsing
	connection.transaction.parse_body = 1;
	next();
}

exports.hook_data_post = function (next, connection) {
	var self = this;

	var body = connection.transaction.body
	, title = (body.header.get_decoded("subject") || "").trim();
	if( body.children && body.children.length ) {
		var child = null;
		body.children.forEach(function(sub) {
			var ct = sub.header.get_decoded("content-type");
			if( ct && ct.indexOf("text/plain") != -1 ){
				child = sub;
			}
		});
		body = child || body.children[0];
	}
	var msg = (body.decodeBody() || "").trim()
	, uri = (body.header.get_decoded("from") || "").trim()
	, node = this.__node;
	if( msg ) {
		var noti = {
			msg: msg
			, title: title
			, type: "notification"
			, node: node.name
			, nodeLabel: node.label
			, createdAt: new Date()
			, uri: uri
		};
		this.loginfo(noti);
		nodes.createMessage(node, noti)
			.done( function() {
				next();
			} )
			.fail( function() {
				next(DENY, DSN.sys_unspecified());
			} );
	} else {
		next();
	}
}

exports.hook_queue = function(next, connection) {
	next(OK);
}

