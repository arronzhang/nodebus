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
type [apns, mqtt] notification server type 
token notification server token
platform [iphone,ipad,itouch,andriod]


POST /del\_client
-------------------------------

id


GET /messages
-------------------------------

###Parameters

count
since\_id
max\_id
page


GET /statuses
-------------------------------

GET /notifications
-------------------------------


