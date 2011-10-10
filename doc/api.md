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
type client type[andriod,ios]
token notification server token
platform [iphone,ipad,itouch,andriod]

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


GET /statuses
-------------------------------

GET /notifications
-------------------------------


