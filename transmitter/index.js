
var env = process.env.NODE_ENV || 'development'
, mqtt = require("./lib/MQTTClient.js")
, mongoq = require("mongoq")
, async = require("async")
, apns = require("./lib/apn.js");


/** db */
/** db */
var dbUrl = "mongodb:\/\/localhost/notihub"
, db = mongoq(dbUrl)
, users = db.collection("users")
, nodes = db.collection("nodes")
, clients = db.collection("clients")
, messages = db.collection("messages");

/* apns config */
var apnsOptions = { 
	cert: __dirname + '/config/cert-dev.pem' /* Certificate file */
	, key:  __dirname + '/config/key-dev.pem'  /* Key file */
	, gateway: 'gateway.sandbox.push.apple.com' /* gateway address */
	, port: 2195 /* gateway port */
	, enhanced: true /* enable enhanced format */
	, errorCallback: function(){
		//console.log(arguments);
	} /* Callback when error occurs */
	, cacheLength: 5 /* Notifications to cache for error purposes */
};

if( env == "production" ) {
	apnsOptions.cert =	__dirname + '/config/cert.pem';
	apnsOptions.key =	__dirname + '/config/key.pem';
	apnsOptions.gateway =	'gateway.push.apple.com';
}

/** apns connnection */
var apnsConnection = new apns.connection( apnsOptions );
//"Basso.aiff", "Blow.aiff", "Bottle.aiff", "Frog.aiff", "Funk.aiff", "Hero.aiff", "Glass.aiff", "Morse.aiff", "Ping.aiff", "Pop.aiff", "Purr.aiff", "Sosumi.aiff", "Submarine.aiff", "Tink.aiff"
function toApns (token, msg) {
	var device = new apns.device(token);
	var note = new apns.notification();
	note.badge = 1;
	note.sound = "default";
	note.alert = msg;
	note.payload = {'messageFrom': 'notihub'};
	note.device = device;
	apnsConnection.sendNotification(note);
}

/** mqtt */

var mq = new mqtt.MQTTClient(1883, '127.0.0.1', 'admin'); 

mq.addListener('sessionOpened', function(){
	console.log( "Mqtt connect ok." );
	send();
	//mq.subscribe('$SYS/#');
	//mq.publish('andriod/hidden', 'here is nodejs');
	//console.log("ok");
});

//mq.addListener('mqttData', function(topic, payload){
//	console.log(topic+':'+payload);
//});

mq.addListener('connectTimeOut', function(){
	exit("Connect mqtt timout out.");
});


mq.addListener('openSessionFailed', function(){
	exit("Open mqtt session failed.");
});

function exit (msg) {
	console.error( msg );
	process.exit(1);
}

/** send message */
function send() {
	//Get 5 unsend message, nealy 30 minutes.
	var delay = 20*30*1000*60;
	messages.find({ 
		sent: { $exists: false } 
		, "type": "notification"
		, createdAt: { $gt: new Date(Date.now() - delay) }
	}).sort({_id: 1}).toArray(function(err, msgs) {
		if( !err && msgs && msgs.length ) {
			async.forEachSeries(msgs, function(message, cb) {
				var msg = truncate( message.nodeName + " - " + message.msg );
				clients.find({userId: message.userId}).toArray(function(err, docs) {
					if( !err && docs && docs.length ) {
						docs.forEach(function(client) {
							if(client.type == "ios" ){
								toApns(client.token, msg);
							}else if(client.type == "android"){
								mq.publish(client.token, msg);
							}
						});
					}
					messages.update({_id: message._id}, {$set: {sent: true}});
					cb();
				});
			}, function() {
				delaySend(500);
			});
		} else {
			delaySend(1000);
		}
	});
}

function delaySend(time){
	setTimeout(send, time);
}

/** helpers */

/**
* Push notifcation message max len 256
*
*/

function truncate (str) {
	str = str + "";
	while(Buffer.byteLength(str) > 80) {
		str = str.slice(0, -1)
	}
	return str;
}

exports.truncate = truncate;
//var token = "3f752377e9e831c5d8e9fe06ab9c40712f60011fd9ca252e8b4316a06e65a601";
//toApns(token, truncate(msg));
