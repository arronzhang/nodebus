if ( process.argv.length != 4 ){
	console.log("Useage: node change_pwd.js login password");
	process.exit();
}

var crypto = require('crypto')
, db = require("mongoq")("mongodb://localhost:27200/nodebus")
, users = db.collection("users")
, login = process.argv[2]
, pwd = process.argv[3];

users.findOne({login: login}, function(err, user) {
	if( !user ) {
		console.log("User is not exist.");
	} else {
		users.update({login: login}, { $set: { cryptedPassword: md5(pwd), password: Buffer(pwd, 'utf8').toString('base64') } }, {safe: true, upsert: true}, function(err, count) {
			if(!err){
				console.log("Ok count:" + count);
			} else {
				console.log(err);
			}
			db.close();
		});
	}
});

function md5 (str, encoding) {
	return crypto
	.createHash('md5')
	.update(str)
	.digest(encoding || 'hex');
}

