
var mailer = require("nodemailer");

mailer.SMTP = {
	host : "smtp.gmail.com"              // smtp server hostname
	, port : 587                     // smtp server port
	, ssl: false
	, use_authentication: true
	, user: "zzdhidden@gmail.com"
	, pass: "107105"
};

//mailer.SMTP = {
//	host : "smtp.gmail.com"              // smtp server hostname
//	, port : 465                     // smtp server port
//	, ssl: true
//	, use_authentication: true
//	, user: "zzdhidden@gmail.com"
//	, pass: "107105"
//};



var testMailFrom = "zzdhidden@gmail.com";
var testMailTitle = "node_mailer 中间中文 test email";
var testMailMsg = "Hello! This is a 中间中文 test of the node_mailer";

function sendMail (user, callback) {
	// body...
	mailer.send_mail({
		//ssl: true,                        // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
		//domain : "hidden.com",            // domain used by client to identify itself to server
		to : user + "@gmail.com",
		sender: testMailFrom,
		subject : testMailTitle,
		body: testMailMsg
	},
	function(err, result){
		callback(err, result);
	});
}

sendMail("zhangzd.opengoss", function() {
	console.log(arguments);
});
