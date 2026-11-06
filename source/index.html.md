---
title: Thruxion API 

# Label shown in the top menu that switches between the API docs
menu_title: Communications API

language_tabs: # must be one of https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers
  - shell
  - ruby
  - python
  - javascript

toc_footers:
  - <a href='https://github.com/slatedocs/slate'>Documentation Powered by Slate</a>

includes:
  - errors

search: true

code_clipboard: true

meta:
  - name: description
    content: Documentation for the Communication API
---

# Thruxion - Communication API

API URL: https://thruxion.com/api/communications/

Communication API allows to register all kind of messages between senders and receivers (humans and/or machines). The channel is the platform where the message travel to its destiny if a noise is registered it can be add to the log. the code is about the language of the message and it can be asociated to senses. It's possible to register the date and time or the geo-location of the messages but it's optional.

![Communication Diagram](./images/c-model.jpg)

The documenatation has a beta programming languages implementation of the API. currently it's possible to choose between Shell, Ruby, Python and JavaScript. 

# Authentication

> To authorize, use this code:

```ruby
require 'net/http'
require 'json'

uri = URI('https://thruxion.com/api/communications/login')
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
req.body = { username: 'admin', password: 'yourpassword' }.to_json

res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
puts res.body
```

```python
import requests

url = "https://thruxion.com/api/communications/login"
data = {"username": "admin", "password": "yourpassword"}

response = requests.post(url, json=data)
print(response.json())  # Prints the token response
```

```shell
curl -X POST "https://thruxion.com/api/communications/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourpassword"}'
```

```javascript
const axios = require('axios');

const login = async () => {
    try {
        const response = await axios.post('https://thruxion.com/api/communications/login', {
            username: 'admin',
            password: 'yourpassword'
        });
        console.log(response.data);  // Prints the token response
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

login();
```

> Make sure to replace with your own API credentials.

The API uses JSON Web Tokens (JWT) for stateless authentication. Users authenticate by logging in with their username and password. Upon successful authentication, a JWT token is generated and returned. This token must then be included in the Authorization header of subsequent requests to access protected endpoints.

The authentication process involves two steps:

1. Login: Submit your username and password to the /api/login endpoint to receive a JWT token
   `{
       "username": "valid-provided-user",
       "password": "valid-provided-pass"
   }`

2. Authenticated Requests: Include the JWT token in the Authorization header as Bearer <your-token> for access to protected routes        `{
       "token": "eyJhbGcIU...I7MzBQ"
   }`

### HTTP Request

`POST https://thruxion.com/api/communications/login`


### URL Parameters

Parameter | Type 
--------- | -----------
user      | string
password  | string

<aside class="notice">
The generated <code>token</code> it will expire after 1 hour 
</aside>


# Communications CRUD

## Create Communication

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI("https://thruxion.com/api/communications/create")  
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json', 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

# Example data to send
data = {
  sender: 'sender_name',
  receiver: 'receiver_name',
  message: 'Hello, this is a test message',
  channel: 'written',
  noise: 'poor internet connection',
  code: 'english',
  feedback: 'delivered',
  sense: 'eyes',
  longitude: '123.4567',
  latitude: '-123.4567',
  date_time: '2025-01-01 00:00:00',
  file_path: 'path/to/file/example.jpeg',
  file: 'example.jpeg'
}

req.body = data.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests
import json

url = "https://thruxion.com/api/communications/create"  
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN", "Content-Type": "application/json"}

# Example data to send
data = {
    "sender": "sender_name",
    "receiver": "receiver_name",
    "message": "Hello, this is a test message",
    "channel": "email",
    "noise": "poor internet connection",
    "code": "english",
    "feedback": "delivered",
    "sense": "eyes",
    "longitude": '123.4567',
    "latitude": '-123.4567',
    "date_time": '2025-01-01 00:00:00',
    "file_path": 'path/to/file/example.jpeg',
    "file": 'example.jpeg'
}

response = requests.post(url, headers=headers, json=data)
print(response.json())  # Prints the response message
```

```shell
curl -X POST "https://thruxion.com/api/communications/create" \  
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "sender": "sender_name",
        "receiver": "receiver_name",
        "message": "Hello, this is a test message",
        "channel": "email",
        "noise": "poor internet connection",
        "code": "english",
        "feedback": "delivered",
        "sense": "eyes",
        "longitude": '123.4567',
        "latitude": '-123.4567',
        "date_time": '2025-01-01 00:00:00',
        "file_path": 'path/to/file/example.jpeg',
        "file": 'example.jpeg'
      }'
```

```javascript
const axios = require('axios');

const addCommunication = async (data, token) => {
    try {
        const response = await axios.post('https://thruxion.com/api/communications/create', data, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log(response.data);  // Prints the response message
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

// Example data to send
const data = {
    sender: 'sender_name',
    receiver: 'receiver_name',
    message: 'Hello, this is a test message',
    channel: 'email',
    noise: 'poor internet connection',
    code: 'english',
    feedback: 'delivered',
    sense: 'eyes',
    longitude: '123.4567',
    latitude: '-123.4567',
    date_time: '2025-01-01 00:00:00',
    file_path: 'path/to/file/example.jpeg',
    file: 'example.jpeg'
};

// Replace 'YOUR_JWT_TOKEN' with the actual token
addCommunication(data, 'YOUR_JWT_TOKEN');
```
> The above command returns JSON structured like this:

```json
[
    { 
        "id": 2,
        "message": "Communication record created successfully"
    }
]
```
This endpoint add a new communication.

### HTTP Request

`POST	 https://thruxion.com/api/communications/create`

### Parameters

Parameter | Default  | Description
--------- | -------- | -----------
sender    | not null | who send the message
receiver  | not null | who recieve the message
channel   | not null | where the message travel
noise     | null     | possible interferences
code      | not null | language of the message
message   | not null | element exhanged
feedback  | not null | response from the reciever
sense     | null     | senses involve in the message
longitude | null     | geo-location (optional)
latitude  | null     | geo-location (optional)
date_time | null     | when the message was sent
file_path | null     | filepath where the message file is stored
file      | file     | New file to upload (optional)


<aside class="notice">
Remember — Include the JWT token in the Authorization header as Bearer.
</aside>


## Read All Communications

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI('https://thruxion.com/api/communications/get/all')  
req = Net::HTTP::Get.new(uri, 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

url = "https://thruxion.com/api/communications/get/all"  
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.get(url, headers=headers)
print(response.json())  # Prints all communications
```

```shell
curl "https://thruxion.com/api/communications/get/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
const axios = require('axios');

const getAllCommunications = async (token) => {
    try {
        const response = await axios.get('https://thruxion.com/api/communications/get/all', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);  // Prints all communications
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

// Replace 'YOUR_JWT_TOKEN' with the actual token
getAllCommunications('YOUR_JWT_TOKEN');
```

> The above command returns JSON structured like this:

```json
[
    {
        "id": 1,
        "sender": "UserA",
        "receiver": "UserB",
        "channel": "Email",
        "noise": "spam",
        "code": "Spanish",
        "message": "Hello, how are you?",
        "feedback": "Sent",
        "sense": "Visual",
        "date_time": "2024-02-13T12:00:00.000Z",
        "file_path": ""
    },
    {
        "id": 2,
        "sender": "Alice",
        "receiver": "Bob",
        "channel": "Zoom",
        "noise": "None",
        "code": "English",
        "message": "Meeting file",
        "feedback": "Delivered",
        "sense": "Audiovisual",
        "date_time": "2025-02-18T15:30:00.000Z",
        "file_path": "/video/call.mp4"
    }
]
```

This endpoint retrieves all communications.

### HTTP Request

`GET https://thruxion.com/api/communications/get/all`


<aside class="notice">
Remember — Include the JWT token in the Authorization header as Bearer.
</aside>

## Read Communication by ID

```ruby
require 'net/http'
require 'json'
require 'uri'

communication_id = '1'  # Replace with the ID of the communication you want to fetch
uri = URI("https://thruxion.com/api/communications/get/id/#{communication_id}")  
req = Net::HTTP::Get.new(uri, 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

communication_id = '1'  # Replace with the ID of the communication you want to fetch
url = f"https://thruxion.com/api/communications/get/id/{communication_id}"  
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.get(url, headers=headers)
print(response.json())  # Prints the communication record
```

```shell
curl "https://thruxion.com/api/communications/get/id/1" \  # Replace '1' with the actual communication ID
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
const axios = require('axios');

const getCommunicationById = async (id, token) => {
    try {
        const response = await axios.get(`https://thruxion.com/api/communications/get/id/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);  // Prints the communication record
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

// Replace '1' with the actual communication ID and 'YOUR_JWT_TOKEN' with the actual token
getCommunicationById('1', 'YOUR_JWT_TOKEN');
```

> The above command returns JSON structured like this:

```json
{
        "id": 2,
        "sender": "Alice",
        "receiver": "Bob",
        "channel": "Zoom",
        "noise": "None",
        "code": "English",
        "message": "Meeting file",
        "feedback": "Finished",
        "sense": "Audiovisual",
        "date_time": "2025-02-18T15:30:00.000Z",
        "file_path": "/video/call.mp4"
}
```

This endpoint retrieves a specific communication.

<!--<aside class="warning">Inside HTML code blocks like this one, you can't use Markdown, so use <code>&lt;code&gt;</code> blocks to denote code.</aside>-->
<!--<aside class="success">Inside HTML code blocks like this one, you can't use Markdown, so use <code>&lt;code&gt;</code> blocks to denote code.</aside>-->

### HTTP Request

`GET https://thruxion.com/api/communications/get/id/<ID>`

### Parameters

Parameter | Description
--------- | -----------
ID        | Communicaton ID

<aside class="notice">
Remember — Include the JWT token in the Authorization header as Bearer.
</aside>


## Update Communication

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI("https://thruxion.com/api/communications/update/COMMUNICATION_ID")  
req = Net::HTTP::Put.new(uri, 'Content-Type' => 'application/json', 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

# Example data to update
data = {
    sender: 'sender_name',
    receiver: 'receiver_name',
    message: 'Hello, this is a test message',
    channel: 'written',
    noise: 'internet poor connection',
    code: 'english',
    feedback: 'delivered',
    sense: 'eyes'
}

req.body = data.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests
import json

url = "https://thruxion.com/api/communications/update/COMMUNICATION_ID"  
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN", "Content-Type": "application/json"}

# Example data to update
data = {
    "sender": "updated_sender_name",
    "receiver": "updated_receiver_name",
    "message": "updated_message",
    "channel": "email",
    "noise": "internet poor connection",
    "code": "english",
    "feedback": "delivered",
    "sense": "eyes"
}

response = requests.put(url, headers=headers, json=data)
print(response.json())  # Prints the response message
```

```shell
curl -X PUT "https://thruxion.com/api/communications/update/COMMUNICATION_ID" \  
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "sender": "updated_sender_name",
        "receiver": "updated_receiver_name",
        "message": "Updated message content",
        "channel": "email",
        "noise": "internet poor connection",
        "code": "english",
        "feedback": "delivered",
        "sense": "eyes"
      }'
```

```javascript
const axios = require('axios');

const updateCommunication = async (id, data, token) => {
    try {
        const response = await axios.put(`https://thruxion.com/api/communications/update/${id}`, data, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log(response.data);  // Prints the response message
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

// Example data to update
const data = {
    sender: 'sender_name',
    receiver: 'receiver_name',
    message: 'Hello, this is a test message',
    channel: 'written',
    noise: 'internet poor connection',
    code: 'english',
    feedback: 'delivered',
    sense: 'eyes'
};

// Replace 'COMMUNICATION_ID' with the actual communication ID and 'YOUR_JWT_TOKEN' with the token
updateCommunication('COMMUNICATION_ID', data, 'YOUR_JWT_TOKEN');
```

> The above command returns JSON structured like this:

```json
{
    "message": "Communication record updated successfully"
}
```

This endpoint update an existing communication.

### HTTP Request

`PUT    https://thruxion.com/api/communications/update/<ID>`

### Parameters

Parameter | Default  | Description
--------- | -------- | -----------
sender    | not null | who send the message
receiver  | not null | who recieve the message
channel   | not null | where the message travel
noise     | null     | possible interferences
code      | not null | language of the message
message   | not null | element exhanged
feedback  | not null | response from the reciever
sense     | null     | senses involve in the message

<aside class="notice">
Remember — Include the JWT token in the Authorization header as Bearer.
</aside>



## Delete Communication

```ruby
require 'net/http'
require 'json'
require 'uri'

uri = URI('https://thruxion.com/api/communications/delete/1')  # Replace '1' with the ID of the record you want to delete
req = Net::HTTP::Delete.new(uri, 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
puts res.body
```

```python
import requests

url = "https://thruxion.com/api/communications/delete/1"  # Replace '1' with the ID of the record you want to delete
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.delete(url, headers=headers)
print(response.json())  # Prints the response after deletion
```

```shell
curl -X DELETE "https://thruxion.com/api/communications/delete/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
const axios = require('axios');

const deleteCommunication = async (id, token) => {
    try {
        const response = await axios.delete(`https://thruxion.com/api/communications/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);  // Prints the response after deletion
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

// Replace '1' with the ID and 'YOUR_JWT_TOKEN' with the actual token
deleteCommunication(1, 'YOUR_JWT_TOKEN');
```

> The above command returns JSON structured like this:

```json
{
    "message": "Communication record deleted successfully"
}
```

This endpoint deletes a specific communication.

### HTTP Request

`DELETE https://thruxion.com/api/communications/delete/<ID>`

### Parameters

Parameter | Description
--------- | -----------
ID        | Communication ID

<aside class="notice">
Remember — Include the JWT token in the Authorization header as Bearer.
</aside>


