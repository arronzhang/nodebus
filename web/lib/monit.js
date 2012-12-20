//var request = require("request");

var baseUrl = "http:\/\/erylee.default:wwkaglch@api.nodebus.com/1";
//baseUrl = "http:\/\/hidden.def:qydftiqq@localhost:3001/1";

function today() {
	var date = new Date();
	//var date = new Date("2011-11-30");
	var start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
		end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	return [start, end];
};

module.exports = {
	count: function(db, callback) {
		var day = today()
			, options = {createdAt: {"$gte": day[0], "$lt": day[1] } };

		return db.users.find(options).limit(5).toArray()
			.and( db.users.count( options ) )
			.and( db.nodes.count( options ) )
			.and( db.messages.count( options ) )
			.done( function( users, unum, nnum, mnum ) {
				users = users.map( function(u) {
					return u.login + "-" + u.name;
				} ).join(",");
				var msg = unum ? "昨天注册了" + unum + "个用户："+users+"，" : "昨天无人注册，";
				msg += "新增节点" + nnum + "个,";
				msg += "发送消息" + mnum + "条。";
				callback && callback( msg );
			} )
			.fail( callback );
	}
}
