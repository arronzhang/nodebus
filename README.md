Notihub
===========================

Download
---------------------------

###Generate ssh key

>	sh ./keygen.sh

or

>	curl https://raw.github.com/gist/1269524/0c4722b92c154f17e903741858c90786049b0568/keygen.sh | sh

Then add the public key at https://notihub.unfuddle.com/a#/people/settings

###Clone 
>	git clone git@notihub.unfuddle.com:notihub/notihub.git
>	cd notihub
>	git submodule update --init


Services
---------------------------

*	monit
*	nginx
*	mongodb			127.0.0.1:27017	
*	m.notihub.com   	127.0.0.1:6101	
*	api.notihub.com 	127.0.0.1:6201	
*	push.notihub.com	0.0.0.0:25		mail server
*	mqtt.notihub.com	0.0.0.0:1883		mosquitto	


Test
----------------------------
