API
===============================


POST /send\_notification
-------------------------------

###Parameters

msg
uri(optional)

###Return Values

On success

On error


POST /send\_status
-------------------------------


POST /register\_client
-------------------------------

###Parameters

id client id
type client type[android,ios]
token notification server token
platform [iphone,ipad,itouch,android]
desc	[notihub for android 1.0]

3f752377e9e831c5d8e9fe06ab9c40712f60011fd9ca252e8b4316a06e65a601

POST /del\_client
-------------------------------

type
id


GET /messages
-------------------------------

###Parameters

count 1~50 default 10
since\_id
max\_id
page


###message

属性			|类型		|描述	
------------------------|---------------|-----------
id			|String		|id
msg			|String		|消息内容
type			|String		|消息类型[notification,status]
createdAt		|Date		|创建时间
uri			|String		|消息uri
nodeName		|String		|消息所属node的登录账号
nodeLabel		|String		|消息所属node的标签


GET /statuses
-------------------------------

GET /notifications
-------------------------------

