#!/bin/sh
cp crontab.nodebus /etc/cron.d/nodebus
service cron reload
