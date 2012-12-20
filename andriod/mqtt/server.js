MQTTServer = require("./mqtt").MQTTServer
s = new MQTTServer();
s.on('new_client', function(client) {
	console.log("---------new_client");
	client.on('connect', function(packet) {
		console.log('-------------connect');
		console.log(packet);
		client.connack(0);
	});

	client.on('publish', function(packet) {
		console.log('-------------publish');
		console.log(packet);
		//client.publish(packet.topic, packet.payload);
	});

	client.on('subscribe', function(packet) {
		console.log('-------------subscribe');
		console.log(packet);
		// See examples
		client.suback(packet.messageId, []);
		setTimeout(function(){
			if( true )
				client.publish("test", "nodejs中文");
		}, 1000);
	});

	client.on('disconnect', function(packet) {
		console.log('-------------disconnect');
		console.log(packet);
		// Goodbye!
	});

	client.on('error', function(error) {
		console.log('-------------error');
		console.log(error);
		// Error!
	});

	client.on('close', function() {
		console.log('--------------close');
	});

	client.on('pingreq', function(packet) {
		console.log('--------------pingreq');
		client.pingresp();
	});
});

s.server.listen(1883);
