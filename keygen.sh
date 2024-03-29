#!/bin/sh

#Generate ssh key, add ssh config

SSH=~/.ssh/config
RSA=~/.ssh/nodebus_rsa
COLOR="\033[1;34m"
COLOREND="\033[0m"
if ! test -f ${SSH} || ! grep -q nodebus ${SSH}; then 
	echo "\n${COLOR}Add host nodebus to ${SSH}${COLOREND}\n"
	echo "\nHost nodebus.unfuddle.com \nIdentitiesOnly yes \nIdentityFile ${RSA}" >> ${SSH}
fi
if ! test -f ${RSA}; then 
	echo "\n${COLOR}Gengrate ssh key to ${RSA}${COLOREND}\n"
	ssh-keygen -t rsa -f ${RSA}
	echo "\n${COLOR}Now you can post the ${RSA}.pub content to https://nodebus.unfuddle.com/a#/people/settings${COLOREND}\n"
	cat ${RSA}.pub
	echo "\n"
fi

