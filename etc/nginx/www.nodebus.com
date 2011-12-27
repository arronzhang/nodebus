
upstream nodebus_mobile {
	server 127.0.0.1:6111;
}

upstream nodebus_web {
	server 127.0.0.1:6101;
}

server {
	listen       80;
	server_name  nodebus.com *.nodebus.com;
	rewrite ^(.*) http://www.nodebus.com permanent;
}

server {
	listen 80;
	server_name w.nodebus.com www.nodebus.com;
	access_log  /var/log/nginx/www.nodebus.com.access.log;
	root /opt/nodebus/web/public;

	client_header_buffer_size 256k;
	large_client_header_buffers 4 256k;
	client_max_body_size             50m;
	client_body_buffer_size        256k;
	client_header_timeout     10m;
	client_body_timeout 10m;
	send_timeout             10m;
	charset utf-8;

	error_page  404 /404.html;

	location /404.html {
		root /opt/nodebus/web/public;
	}

	error_page 500 502 503 504 /500.html;

	location /500.html {
		root /opt/nodebus/web/public;
	}

	location /get-status {
		stub_status on;
		access_log  off;
	}

	location /(favicon.ico|robots.txt) {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location ~ ^/?(images|js|css)/ {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location ~* ^.+\.(html|htm|xhtml)$ {
		root /opt/nodebus/web/public;
		access_log off;
		expires 30d;
	}

	location / {
		proxy_pass http://nodebus_web;
		proxy_redirect          off;
		proxy_set_header        Host $host:$proxy_port;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		client_max_body_size    10m;
		client_body_buffer_size 256k;
		proxy_connect_timeout   90;
		proxy_send_timeout      90;
		proxy_read_timeout      90;
		proxy_buffer_size       256k;
		proxy_buffers           4 256k;
		proxy_busy_buffers_size 256k;
		proxy_temp_file_write_size 256k;
	}
}

server {
	listen 80;
	server_name m.nodebus.com;
	access_log  /var/log/nginx/m.nodebus.com.access.log;
	root /opt/nodebus/web/public;

	client_header_buffer_size 256k;
	large_client_header_buffers 4 256k;
	client_max_body_size             50m;
	client_body_buffer_size        256k;
	client_header_timeout     10m;
	client_body_timeout 10m;
	send_timeout             10m;
	charset utf-8;

	error_page  404 /404.html;

	location /404.html {
		root /opt/nodebus/web/public;
	}

	error_page 500 502 503 504 /500.html;

	location /500.html {
		root /opt/nodebus/web/public;
	}

	location /get-status {
		stub_status on;
		access_log  off;
	}

	location /(favicon.ico|robots.txt) {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location ~ ^/?(images|js|css)/ {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location ~* ^.+\.(html|htm|xhtml)$ {
		root /opt/nodebus/web/public;
		access_log off;
		expires 30d;
	}

	location / {
		proxy_pass http://nodebus_mobile;
		proxy_redirect          off;
		proxy_set_header        Host $host:$proxy_port;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		client_max_body_size    10m;
		client_body_buffer_size 256k;
		proxy_connect_timeout   90;
		proxy_send_timeout      90;
		proxy_read_timeout      90;
		proxy_buffer_size       256k;
		proxy_buffers           4 256k;
		proxy_busy_buffers_size 256k;
		proxy_temp_file_write_size 256k;
	}
}

upstream nodebus_api {
	server 127.0.0.1:6201;
}

server {

	listen 80;
	server_name api.nodebus.com api.nodehub.cn;
	access_log  /var/log/nginx/api.nodebus.com.access.log;
	root /opt/nodebus/api/public;

	client_header_buffer_size 256k;
	large_client_header_buffers 4 256k;
	client_max_body_size             50m;
	client_body_buffer_size        256k;
	client_header_timeout     10m;
	client_body_timeout 10m;
	send_timeout             10m;
	charset utf-8;

	location /(favicon.ico|robots.txt) {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location / {
		proxy_pass http://nodebus_api;
		proxy_redirect          off;
		proxy_set_header        Host $host:$proxy_port;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		client_max_body_size    10m;
		client_body_buffer_size 256k;
		proxy_connect_timeout   90;
		proxy_send_timeout      90;
		proxy_read_timeout      90;
		proxy_buffer_size       256k;
		proxy_buffers           4 256k;
		proxy_busy_buffers_size 256k;
		proxy_temp_file_write_size 256k;
	}
}

upstream nodebus_monit {
	server 127.0.0.1:2812;
}

server {

	listen 80;
	server_name monit.nodebus.com monit.nodehub.cn;
	access_log  /var/log/nginx/monit.nodebus.com.access.log;
	root /opt/nodebus/web/public;

	client_header_buffer_size 256k;
	large_client_header_buffers 4 256k;
	client_max_body_size             50m;
	client_body_buffer_size        256k;
	client_header_timeout     10m;
	client_body_timeout 10m;
	send_timeout             10m;
	charset utf-8;

	location /(favicon.ico|robots.txt) {
		root /opt/nodebus/web/public;
		access_log  off;
		expires 30d;
	}

	location / {
		proxy_pass http://nodebus_monit;
		proxy_redirect          off;
		proxy_set_header        Host $host:$proxy_port;
		proxy_set_header        X-Real-IP $remote_addr;
		proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
		client_max_body_size    10m;
		client_body_buffer_size 256k;
		proxy_connect_timeout   90;
		proxy_send_timeout      90;
		proxy_read_timeout      90;
		proxy_buffer_size       256k;
		proxy_buffers           4 256k;
		proxy_busy_buffers_size 256k;
		proxy_temp_file_write_size 256k;
	}
}

