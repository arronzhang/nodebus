NodeBus
===========================

domain: nodebus.com

Download
---------------------------
 
>	git clone git@github.com:zzdhidden/nodebus.git --recursive
>
>	cd nodebus
>
>	sh ./bin/update
>
>	sh ./bin/install
>
>	cd web
>
>	#Please start mongod at port 27200
>
>	node index.js
>
>	#curl http://localhost:3000


Services
---------------------------

*	monit
*	nginx
*	mongodb			127.0.0.1:27200	
*	www.nodebus.com 	127.0.0.1:6101	
*	m.nodebus.com   	127.0.0.1:6111	
*	api.nodebus.com 	127.0.0.1:6201	
*	push.nodebus.com	0.0.0.0:25		mail server
*	mqtt.nodebus.com	0.0.0.0:1883		mosquitto	

Test
----------------------------
