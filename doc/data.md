数据
===============================

用户users
-------------------------------

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
login			|String		|用户名，用来登录
cryptedPassword		|String		|加密过的密码
name			|String		|用户名字
email			|String		|用户邮箱
createAt		|Date		|创建时间
updateAt		|Date		|更新时间

###客户端clients

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
id			|String		|客户端id
userId			|ObjectID	|所属用户ID
token			|String		|通知服务器的节点id
platform		|String		|客户端平台描述
type			|String		|客户端系统类型[andriod,ios]
createAt		|Date		|创建时间
updateAt		|Date		|创建时间


节点nodes
---------------------------------

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
login			|String		|节点
secret			|String		|密钥
name			|String		|节点名称
emailKey		|String		|节点pushmail账号密码
userId			|ObjectID	|该节点用户id
createAt		|Date		|创建时间
updateAt		|Date		|更新时间

消息messages
---------------------------------

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
msg			|String		|消息内容
nodeId			|ObjectID	|消息所属节点id
userId			|ObjectID	|消息所属用户id
type			|String		|消息类型[notification,status]
createAt		|Date		|创建时间
updateAt		|Date		|更新时间
uri			|String		|消息uri
nodeLogin		|String		|消息所属node的登录账号(冗余)
nodeName		|String		|消息所属node的名称(冗余)

