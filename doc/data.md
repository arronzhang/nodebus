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
createdAt		|Date		|创建时间
updatedAt		|Date		|更新时间

###客户端clients

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
id			|String		|客户端id
userLogin		|String		|所属用户Login
token			|String		|通知服务器的节点id
platform		|String		|客户端平台描述
type			|String		|客户端系统类型[android,ios]
desc			|String		|客户端描述
createdAt		|Date		|创建时间
updatedAt		|Date		|创建时间


节点nodes
---------------------------------

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
name			|String		|节点
apikey			|String		|密钥
label			|String		|节点名称
userLogin		|String		|该节点用户账号
createdAt		|Date		|创建时间
updatedAt		|Date		|更新时间

消息messages
---------------------------------

###字段说明

属性			|类型		|描述	
------------------------|---------------|-----------
\_id			|ObjectID	|\_id
msg			|String		|消息内容
nodeName		|String		|消息所属节点名称
nodeLabel		|String		|消息所属节点标签
userLogin		|String		|消息所属用户登录账号
userName		|String		|消息所属用户名称
type			|String		|消息类型[notification,status]
createdAt		|Date		|创建时间
updatedAt		|Date		|更新时间
uri			|String		|消息uri

