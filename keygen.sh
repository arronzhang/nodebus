#!/bin/sh

#Generate ssh key, add ssh config

SSH=~/.ssh/config
RSA=~/.ssh/notihub_rsa
COLOR="\033[1;34m"
COLOREND="\033[0m"
if ! test -f ${SSH} || ! grep -q notihub ${SSH}; then 
	echo "\n${COLOR}Add host notihub to ${SSH}${COLOREND}\n"
	echo "\nHost notihub.unfuddle.com \nIdentitiesOnly yes \nIdentityFile ${RSA}" >> ${SSH}
fi
if ! test -f ${RSA}; then 
	echo "\n${COLOR}Gengrate ssh key to ${RSA}${COLOREND}\n"
	ssh-keygen -t rsa -f ${RSA}
	echo "\n${COLOR}Now you can post the ${RSA}.pub content to https://notihub.unfuddle.com/a#/people/settings${COLOREND}\n"
	cat ${RSA}.pub
	echo "\n"
fi

