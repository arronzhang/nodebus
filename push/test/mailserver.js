
/**
* Test server for black box tests.
* @author Euan Goddard
*/

var smtpevent = require('./smtpevent.js'),

server = new smtpevent.SMTPServer('localhost');

server.listen(25);
server.on('incoming-mail', function (peer, from, to, message) {
	console.log('Received test message from: '+ peer);
	console.log('Message from: '+ from + ' to: '+ to);
	console.log('---------------------');
	console.log(message);
	console.log('---------------------');
});


//msg
//
//---------------------
//Received: by host.monit.cn (Postfix, from userid 501)
//	id 1192D528BE81; Sat,  1 Oct 2011 19:04:48 +0800 (CST)
//	To: root@push.nodebus.com
//	Subject: subject
//	Message-Id: <20111001110448.1192D528BE81@host.monit.cn>
//	Date: Sat,  1 Oct 2011 19:04:48 +0800 (CST)
//	From: hidden@monit.cn (hidden)
//
//	bodydd
//	---------------------
