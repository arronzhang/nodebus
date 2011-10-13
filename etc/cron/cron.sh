#!/bin/sh
cp crontab.notihub /etc/cron.d/notihub
service cron reload
