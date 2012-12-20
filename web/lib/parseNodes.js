var Iconv = require("iconv").Iconv
  , fs = require("fs")
  , csv = require("csv")
  , iconv = new Iconv("GBK",'UTF-8//IGNORE');

module.exports = function parseNodes( file, callback ) {
	fs.readFile( file, function(err, data) {
		if( err ) {
			return callback( err );
		}

		data = iconv.convert(data);

		var isReturn = 0
		  , nodes = [];

		csv().from(data, {
			trim: true
		  , columns: true
		})
			.transform(function(data) {
				var d = {
					name: data.name || data.id || data.ID || data["账号"]
				  , label: data.label || data["名称"]
				  , host: data.host || data["IP地址"] || data["IP"] || data["ip"]
				};
				d.name = d.name && d.name.split(".").pop();
				return d;
			})
			.on('data', function(data, index) {
				//console.log( data );
				nodes.push( data );
			})
			.on('end', function(count) {
				!isReturn && callback( null, nodes ) && (isReturn = true);
			})
			.on('error', function(error) {
				!isReturn && callback( error ) && (isReturn = true);
			});
	} );
};


