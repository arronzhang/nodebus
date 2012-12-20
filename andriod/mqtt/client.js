var mqtt = require("./MQTTClient.js");

/** mqtt */

var mq = new mqtt.MQTTClient(1883, '127.0.0.1', 'admin');

mq.addListener('sessionOpened', function(){
	console.log( "Mqtt connect ok." );
	//mq.subscribe('$SYS/#');
	mq.subscribe('test');
	mq.publish('test', 'nodejs测试中文啊');
	//mq.publish('andriod/hidden', 'here is nodejs');
	//console.log("ok");
});

mq.addListener('mqttData', function(topic, payload){
	console.log(topic+':'+payload);
});

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
