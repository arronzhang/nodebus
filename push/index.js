
process.env.HARAKA = __dirname;

var Header = require("Haraka/mailheader").Header
, Body = require("Haraka/mailbody").Body
, mimelib = require("./lib/mime-functions.js");

/* Fix header encoding */
function decode_header(val){
	// Fold continuations
	val = val.replace(/\n[ \t]+/g, "\n ");

	// remove end carriage return
	val = val.replace(/\r?\n$/, '');

	if (! (/=\?/.test(val)) ) {
		// no encoded stuff
		return val;
	}
	return val.replace(/=\?[^?]+\?[QqBb]\?[^?]+\?=/g, function(a){return mimelib.decodeMimeWord(a)});
}

Header.prototype._add_header = function (key, value, method) {
	this.headers[key] = this.headers[key] || [];
	this.headers[key][method](value);
	this.headers_decoded[key] = this.headers_decoded[key] || [];
	this.headers_decoded[key][method](decode_header(value));
};

/* Fix body encoding */

Body.prototype.getCharset = function() {
	var match = (this.header.get_decoded('content-type') || "").match(/charset=([0-9a-zA-Z-]+)/);
	return (match && match[1]) || "UTF-8";
};

Body.prototype.decode_qp = function (line) {
	var charset = this.getCharset();
	line = line.replace(/=\r?\n/, '');
	return mimelib.decodeQuotedPrintable(line, false, charset);
}

Body.prototype.decode_base64 = function (line) {
	return mimelib.decodeBase64(line, this.getCharset());
}


Body.prototype.decodeBody = function() {
	return this.decode_function && this.decode_function(this.bodytext);
}

Body.prototype.parse_body = function (line) {
	//this.bodytext += this.decode_function(line);
	this.bodytext += line;
}

Body.prototype.parse_multipart_preamble = function (line) {
	if (this.boundary) {
		if (line.substr(0, (this.boundary.length + 2)) === ('--' + this.boundary)) {
			if (line.substr(this.boundary.length + 2, 2) === '--') {
				end
				return;
			}
			else {
				// next section
				var bod = new Body(new Header(), this.options);
				this.listeners('attachment_start').forEach(function (cb) { bod.on('attachment_start', cb) });
				this.listeners('attachment_data' ).forEach(function (cb) { bod.on('attachment_data', cb) });
				this.listeners('attachment_end'  ).forEach(function (cb) { bod.on('attachment_end', cb) });
				this.children.push(bod);
				bod.state = 'headers';
				this.state = 'child';
				return;
			}
		}
	}
	//this.bodytext += this.decode_function(line);
	this.bodytext += line;
}

require("Haraka");
