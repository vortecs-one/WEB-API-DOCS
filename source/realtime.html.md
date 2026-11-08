---
title: Thruxion API - Real-Time WebSocket

# Label shown in the top menu that switches between the API docs
menu_title: Real-Time WebSocket

language_tabs: # must be one of https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers
  - shell
  - ruby
  - python
  - javascript

toc_footers:
  - <a href='https://github.com/slatedocs/slate'>Documentation Powered by Slate</a>

includes:
  - realtime_errors

search: true

code_clipboard: true

meta:
  - name: description
    content: Documentation for the Real-Time WebSocket API
---

# Thruxion - Realtime WebSocket

WebSocket URL: wss://rt.thruxion.com/v1/ws

REST API URL: https://rt.thruxion.com/v1/

The Real-Time WebSocket API streams device locations live. Phones (and websites you allow) keep a WebSocket open and send their position as it changes; staff watch those positions live on a map, look up the history of a device and revoke devices. Points are stored for 30 days.

There are two sides:

* **Public** (`rt.thruxion.com`): phones and allowed websites register a device and send locations.
* **Private** (the staff host, reachable only from the office or the VPN): staff watch live views, read history and the audit log. See [Staff](#staff).

The documentation has code examples in Shell, Ruby, Python and JavaScript:

* Shell: `curl` for REST calls and [`websocat`](https://github.com/vi/websocat) for the WebSocket.
* Ruby: `net/http`, and the `faye-websocket` gem (which runs on EventMachine) for the WebSocket.
* Python: the `requests` and `websockets` packages.
* JavaScript: Node.js with the `axios` and `ws` packages.

Conventions used everywhere:

* REST requests and responses are JSON over HTTPS. Responses are never cached.
* WebSocket messages are JSON **text** frames of at most 16 KiB, all in the same envelope (see [Message Format](#message-format)).
* Every request needs an access token: in the `Authorization: Bearer <token>` header for REST calls and phone connections, or a one-time [ticket](#get-websocket-ticket) for browsers.
* Device IDs are UUIDs. Times are epoch milliseconds inside WebSocket messages, and ISO 8601 (UTC) in REST responses, for example `2026-10-05T20:00:00.000Z`.

# Authentication

Access tokens come from Thruxion's Keycloak server, using OpenID Connect (authorization code flow with PKCE S256). The password is typed only on the Keycloak login page, never in your app or website.

Who | Realm (issuer) | Client | Role needed
--- | -------------- | ------ | -----------
Android app | `https://rt.thruxion.com/realms/field` | `rt-android` | `tracker`
Website | `https://rt.thruxion.com/realms/field` | `rt-web` | `tracker`
Staff dashboard | `https://<staff host>/realms/staff` | `rt-dashboard` | `developer` or `admin`

The OpenID configuration of a realm is at `<issuer>/.well-known/openid-configuration`. All clients are public (there is no client secret) and the password grant is disabled, so use an OpenID Connect library such as AppAuth on Android or `oidc-client-ts` in a browser.

Access tokens last **5 minutes**. Refresh them with the refresh token before they expire. A WebSocket can stay open much longer: see [Keeping a Connection Alive](#keeping-a-connection-alive).

<aside class="notice">
The examples on this page read the access token from <code>$TOKEN</code> (or <code>TOKEN</code>) and the device ID from <code>$DEVICE_ID</code>. Replace them with your own values.
</aside>

<aside class="warning">
Keep tokens in memory, never in local storage, cookies or URLs. Each refresh token works only once: if one is used twice, Keycloak ends the whole session.
</aside>

# Devices

Before it can connect, a phone or browser registers itself as a device. A user can have up to **3** active devices. These endpoints are on the public host and need a token from the `field` realm with the `tracker` role.

## Register Device

```ruby
require 'net/http'
require 'json'

uri = URI('https://rt.thruxion.com/v1/devices')
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json',
                               'Authorization' => "Bearer #{ENV['TOKEN']}")
req.body = { name: 'Pixel 8', appVersion: '1.4.0' }.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

url = "https://rt.thruxion.com/v1/devices"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}
data = {"name": "Pixel 8", "appVersion": "1.4.0"}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

```shell
curl -X POST "https://rt.thruxion.com/v1/devices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pixel 8", "appVersion": "1.4.0"}'
```

```javascript
const axios = require('axios');

const registerDevice = async () => {
    try {
        const response = await axios.post(
            'https://rt.thruxion.com/v1/devices',
            { name: 'Pixel 8', appVersion: '1.4.0' },
            { headers: { Authorization: `Bearer ${process.env.TOKEN}` } }
        );
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

registerDevice();
```

> The above command returns JSON structured like this (201):

```json
{
    "id": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11",
    "name": "Pixel 8",
    "appVersion": "1.4.0",
    "status": "active",
    "createdAt": "2026-10-05T20:00:00.000Z",
    "lastSeenAt": null
}
```

> The user already has 3 active devices (409):

```json
{
    "error": "device_limit",
    "max": 3
}
```

Registers the phone or browser that makes the request. Keep the returned `id`: it is the `X-Device-Id` the phone sends when it connects, and the `deviceId` a website asks a ticket for. Register once per installation, not on every start.

### HTTP Request

`POST https://rt.thruxion.com/v1/devices`

### Parameters

Parameter | Required | Description
--------- | -------- | -----------
name | no | A name to recognise the device, up to 64 characters: letters, digits, spaces and `_ . ' -`. Staff see it in their dashboard.
appVersion | no | Your app's version, up to 32 characters: letters, digits and `. + -`.

### Response

Field | Type | Description
----- | ---- | -----------
id | string | The device ID (UUID).
name | string | The name sent, or `""`.
appVersion | string | The app version sent, or `""`.
status | string | `active` or `revoked`.
createdAt | string | When the device was registered.
lastSeenAt | string or null | When the device last connected, or `null`.

<aside class="notice">
Registration is limited to 5 requests per minute per user. Over that, the API answers <code>429</code>.
</aside>

## List My Devices

```ruby
require 'net/http'

uri = URI('https://rt.thruxion.com/v1/devices')
req = Net::HTTP::Get.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

url = "https://rt.thruxion.com/v1/devices"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}

response = requests.get(url, headers=headers)
print(response.json())
```

```shell
curl "https://rt.thruxion.com/v1/devices" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const listDevices = async () => {
    try {
        const response = await axios.get('https://rt.thruxion.com/v1/devices', {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

listDevices();
```

> The above command returns JSON structured like this:

```json
{
    "devices": [
        {
            "id": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11",
            "name": "Pixel 8",
            "appVersion": "1.4.0",
            "status": "active",
            "createdAt": "2026-10-05T20:00:00.000Z",
            "lastSeenAt": "2026-10-05T21:14:03.000Z"
        }
    ]
}
```

Returns the devices of the logged-in user. Each device has the fields described in [Register Device](#register-device).

### HTTP Request

`GET https://rt.thruxion.com/v1/devices`

## Revoke My Device

```ruby
require 'net/http'

device_id = ENV['DEVICE_ID']

uri = URI("https://rt.thruxion.com/v1/devices/#{device_id}")
req = Net::HTTP::Delete.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.code
```

```python
import os
import requests

device_id = os.environ["DEVICE_ID"]
url = f"https://rt.thruxion.com/v1/devices/{device_id}"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}

response = requests.delete(url, headers=headers)
print(response.status_code)
```

```shell
curl -X DELETE "https://rt.thruxion.com/v1/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const revokeDevice = async (deviceId) => {
    try {
        const response = await axios.delete(`https://rt.thruxion.com/v1/devices/${deviceId}`, {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` }
        });
        console.log(response.status);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

revokeDevice(process.env.DEVICE_ID);
```

> The above command returns `204 No Content` with an empty body.

Revokes one of the user's own devices, for example a lost phone. Its open WebSocket closes with code `4003`, and it can no longer connect. A revoked device no longer counts towards the limit of 3.

### HTTP Request

`DELETE https://rt.thruxion.com/v1/devices/<ID>`

### URL Parameters

Parameter | Description
--------- | -----------
ID | The device ID. Answers `404` if it is not one of the user's active devices.

## Get WebSocket Ticket

```ruby
require 'net/http'
require 'json'

uri = URI('https://rt.thruxion.com/v1/ws-tickets')
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json',
                               'Authorization' => "Bearer #{ENV['TOKEN']}")
req.body = { deviceId: ENV['DEVICE_ID'] }.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

url = "https://rt.thruxion.com/v1/ws-tickets"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}
data = {"deviceId": os.environ["DEVICE_ID"]}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

```shell
curl -X POST "https://rt.thruxion.com/v1/ws-tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"deviceId\": \"$DEVICE_ID\"}"
```

```javascript
// In a web page (the browser sends the Origin header)
const getTicket = async (token, deviceId) => {
    const response = await fetch('https://rt.thruxion.com/v1/ws-tickets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    return (await response.json()).ticket;
};
```

> The above command returns JSON structured like this (201):

```json
{
    "ticket": "kq3V0b1mZ4hY9wT6uR2sXcLp8eNfAa7DgJiOyHtE5vQ",
    "expiresIn": 30
}
```

Browsers cannot set headers on a WebSocket, so a website exchanges its access token for a one-time ticket and puts the ticket in the WebSocket URL instead (see [Websites](#websites)). Phones do not need tickets.

Each ticket works **once**, within **30 seconds**, for that one device. Get a new ticket for every connection.

### HTTP Request

`POST https://rt.thruxion.com/v1/ws-tickets`

### Parameters

Parameter | Required | Description
--------- | -------- | -----------
deviceId | yes | The ID of one of the user's active devices. Otherwise the API answers `403` with `device_not_allowed`.

<aside class="notice">
Tickets are limited to 10 requests in a burst per user, then one every 2 seconds.
</aside>

# Connecting

## Connect a Phone

```ruby
require 'faye/websocket'
require 'eventmachine'
require 'json'

EM.run do
  ws = Faye::WebSocket::Client.new('wss://rt.thruxion.com/v1/ws', ['rt.v1.json'],
    headers: { 'Authorization' => "Bearer #{ENV['TOKEN']}",
               'X-Device-Id'   => ENV['DEVICE_ID'] })

  ws.on :open do
    ws.send({ v: 1, type: 'location.update', id: 'm-1',
              data: { seq: 1, t: (Time.now.to_f * 1000).to_i,
                      lat: -33.4389, lon: -70.6475, acc: 6,
                      src: 'fused', mock: false } }.to_json)
  end

  ws.on :message do |event|
    puts event.data # {"v":1,"type":"ack","ref":"m-1","data":{"seqs":[1],"rejected":[]}}
  end

  ws.on :close do |event|
    puts "closed: #{event.code} #{event.reason}"
    EM.stop
  end
end
```

```python
import asyncio
import json
import os
import time

import websockets

async def main():
    headers = {
        "Authorization": f"Bearer {os.environ['TOKEN']}",
        "X-Device-Id": os.environ["DEVICE_ID"],
    }
    async with websockets.connect(
        "wss://rt.thruxion.com/v1/ws",
        subprotocols=["rt.v1.json"],
        additional_headers=headers,
    ) as ws:
        await ws.send(json.dumps({
            "v": 1, "type": "location.update", "id": "m-1",
            "data": {"seq": 1, "t": int(time.time() * 1000),
                     "lat": -33.4389, "lon": -70.6475, "acc": 6,
                     "src": "fused", "mock": False},
        }))
        print(await ws.recv())

asyncio.run(main())
```

```shell
# Type one JSON message per line; the server's replies are printed
websocat --protocol rt.v1.json \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Device-Id: $DEVICE_ID" \
  wss://rt.thruxion.com/v1/ws
```

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('wss://rt.thruxion.com/v1/ws', 'rt.v1.json', {
    headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
        'X-Device-Id': process.env.DEVICE_ID
    }
});

ws.on('open', () => {
    ws.send(JSON.stringify({
        v: 1, type: 'location.update', id: 'm-1',
        data: { seq: 1, t: Date.now(), lat: -33.4389, lon: -70.6475,
                acc: 6, src: 'fused', mock: false }
    }));
});

ws.on('message', (data) => console.log(data.toString()));
ws.on('close', (code, reason) => console.log('closed:', code, reason.toString()));
```

> The server answers with an ack:

```json
{
    "v": 1,
    "type": "ack",
    "ref": "m-1",
    "data": { "seqs": [1], "rejected": [] }
}
```

Phones open the WebSocket with their access token and device ID in headers.

### WebSocket Request

`GET wss://rt.thruxion.com/v1/ws`

### Headers

Header | Description
------ | -----------
Sec-WebSocket-Protocol | Must offer `rt.v1.json`. Otherwise the upgrade is refused with `400`.
Authorization | `Bearer <access token>` from the realm `field`, with the role `tracker`.
X-Device-Id | The device ID from [Register Device](#register-device). The device must belong to the logged-in user and be active.
Origin | Must **not** be sent. Requests with an `Origin` are treated as coming from a website.

If the upgrade is refused, the server answers with a plain HTTP status instead of a WebSocket:

Status | Meaning | What the app should do
------ | ------- | ----------------------
400 | Missing subprotocol or malformed device ID | Fix the request.
401 | Missing, invalid or expired token | Refresh the token, then retry.
403 | No `tracker` role, or the device is unknown, someone else's or revoked | Stop; the user must log in again or register the device again.
429 | Too many open connections for this user | Retry later with backoff.
503 | Server restarting or a dependency is down | Retry with backoff.

The server sends a ping frame every 25 seconds. WebSocket libraries (OkHttp, for example) answer it automatically; a client that stops answering is dropped.

<aside class="warning">
Open only one connection per device. When the same device connects again, the older connection is closed with code <code>4009</code>; do not reconnect from that one.
</aside>

## Message Format

> Every message uses the same envelope:

```json
{ "v": 1, "type": "location.update", "id": "m-1842", "data": { } }
```

Messages are JSON text frames of at most 16 KiB. A binary frame closes the connection with `1003`, a larger frame with `1009`.

Field | Description
----- | -----------
v | Protocol version. Always `1`.
type | The message type, for example `location.update`.
id | Chosen by the client: 1–64 characters, letters, digits and `_ . : -`. The server repeats it as `ref` in its reply, so you can match replies to messages.
data | The message's content. Its fields depend on `type`.

Unknown fields are rejected anywhere in a message.

# Sending Locations

## location.update

> One point:

```json
{
    "v": 1,
    "type": "location.update",
    "id": "m-1842",
    "data": {
        "seq": 1842,
        "t": 1791234606812,
        "lat": -33.4389,
        "lon": -70.6475,
        "acc": 6,
        "spd": 1.5,
        "brg": 120,
        "alt": 570,
        "src": "fused",
        "mock": false
    }
}
```

Sends one location fix.

### Point Fields

Field | Required | Description
----- | -------- | -----------
seq | yes | A number that increases for every point of this device. Acks refer to it. Integer, 0 or more.
t | yes | When the fix was taken, in epoch milliseconds. Must be within the last 7 days and at most 2 minutes ahead of the server clock.
lat | yes | Latitude, −90 to 90.
lon | yes | Longitude, −180 to 180.
acc | yes | Horizontal accuracy in metres, more than 0 and at most 10 000.
alt | no | Altitude in metres, −1 000 to 20 000.
spd | no | Speed in m/s, 0 to 350.
brg | no | Bearing in degrees, 0 up to (but not including) 360.
src | yes | Location provider: `gps`, `network` or `fused`.
mock | yes | Whether the fix is a mock location (`Location.isMock()` on Android): `true` or `false`.

<aside class="notice">
Never send user or device IDs in a point: the server takes them from the connection.
</aside>

Phones can send about 1 message per second, with bursts of up to 10. Faster messages get a `rate_limited` error.

## location.batch

> Points saved while offline:

```json
{
    "v": 1,
    "type": "location.batch",
    "id": "b-77",
    "data": {
        "points": [
            { "seq": 1, "t": 1791234600000, "lat": -33.4389, "lon": -70.6475, "acc": 6, "src": "gps", "mock": false },
            { "seq": 2, "t": 1791234605000, "lat": -33.4391, "lon": -70.6472, "acc": 5, "src": "gps", "mock": false }
        ]
    }
}
```

Sends points that were saved while the phone was offline: 1 to 100 points, each with a different `seq`. Each point has the fields of [location.update](#location-update).

# Server Replies

## ack

> Ack for a batch, with one point rejected:

```json
{
    "v": 1,
    "type": "ack",
    "ref": "b-77",
    "data": {
        "seqs": [1, 2, 3],
        "rejected": [ { "seq": 1, "reason": "too_old" } ]
    }
}
```

The points are safely queued. `seqs` lists every point of the message, including the rejected ones. Delete all of them from the phone's buffer: rejected points will never be accepted.

Rejection reason | Meaning
---------------- | -------
too_old | The fix is more than 7 days old.
in_future | The fix is more than 2 minutes ahead of the server clock.

## error

> Error reply:

```json
{ "v": 1, "type": "error", "ref": "m-1842", "data": { "code": "rate_limited" } }
```

Nothing was stored. Keep the points and send them again later. The error codes are listed in [WebSocket Error Codes](#websocket-error-codes).

After more than 10 invalid or rate-limited messages, the server closes the connection with code `1008`.

## Delivery Rules

To lose no points when the network drops:

1. Save each fix in a local buffer before sending it.
2. Delete points from the buffer only when an `ack` lists their `seq`.
3. After reconnecting, send the buffer with `location.batch`, oldest first, then continue with live updates.
4. Resending a point is harmless: the server stores each (device, fix time) only once.

# Keeping a Connection Alive

> 1. The server warns about 60 seconds before the token expires:

```json
{ "v": 1, "type": "session.expiring", "data": { "expiresAt": 1791234606812 } }
```

> 2. The client refreshes its token with Keycloak and sends the new one:

```json
{ "v": 1, "type": "auth.refresh", "id": "r-1", "data": { "token": "<new access token>" } }
```

> 3. The server accepts it:

```json
{ "v": 1, "type": "ack", "ref": "r-1", "data": { "expiresAt": 1791234906812 } }
```

Access tokens last 5 minutes, but a connection can stay open for hours by sending a new token over the socket:

1. About 60 seconds before the token expires, the server sends `session.expiring` with the expiry time (`expiresAt`, epoch milliseconds).
2. The client refreshes its token with Keycloak and sends it in `auth.refresh`.
3. The server answers `ack` with the new `expiresAt`, or `error` with `auth_failed` (an invalid token, or a token for another user).

Without a refresh, the connection closes with `4001` when the token expires.

The server also closes connections with `4003` when the device is revoked, or when the Keycloak session ends (the user logs out, or an admin ends the session). This happens on every server at once, within about a second.

# Websites

```javascript
// In a web page. See "Get WebSocket Ticket" for getTicket().
const connect = async (token, deviceId) => {
    const ticket = await getTicket(token, deviceId);
    const ws = new WebSocket(
        `wss://rt.thruxion.com/v1/ws?ticket=${encodeURIComponent(ticket)}`,
        'rt.v1.json'
    );
    let seq = Date.now();

    ws.onopen = () => {
        navigator.geolocation.watchPosition((pos) => {
            const c = pos.coords;
            if (c.accuracy > 10000) return; // skip very rough fixes
            ws.send(JSON.stringify({
                v: 1, type: 'location.update', id: `m-${seq}`,
                data: { seq: seq++, t: pos.timestamp, lat: c.latitude, lon: c.longitude,
                        acc: c.accuracy, src: 'fused', mock: false }
            }));
        });
    };
    ws.onmessage = (event) => console.log(event.data);
    ws.onclose = (event) => console.log('closed:', event.code);
};
```

```shell
# Browsers use a ticket instead of headers. To try it from a shell:
TICKET=$(curl -s -X POST "https://rt.thruxion.com/v1/ws-tickets" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Origin: https://app.example.com" \
  -d "{\"deviceId\": \"$DEVICE_ID\"}" | jq -r .ticket)

websocat --protocol rt.v1.json -H "Origin: https://app.example.com" \
  "wss://rt.thruxion.com/v1/ws?ticket=$TICKET"
```

```ruby
# Websites connect from the browser: see the JavaScript tab.
```

```python
# Websites connect from the browser: see the JavaScript tab.
```

A web page can send its browser's location too, but only from a website that Thruxion has allowed. Requests from any other origin get `403` (`origin_not_allowed`). Ask Thruxion to add your website's exact origins (scheme, host and port, for example `https://app.example.com`) and its login callback URLs.

Browsers cannot set headers on a WebSocket, so a page uses a one-time ticket instead of `Authorization` and `X-Device-Id`:

1. Log in with the realm `field`, client `rt-web` (see [Authentication](#authentication)).
2. Register the browser once with [Register Device](#register-device), and keep its `id` in local storage.
3. Get a ticket with [Get WebSocket Ticket](#get-websocket-ticket).
4. Open `wss://rt.thruxion.com/v1/ws?ticket=<ticket>`, offering the subprotocol `rt.v1.json`.

Messages, acks, token refresh and close codes are the same as for phones. What is different in a browser:

* Send `"src": "fused"` and `"mock": false`: browsers name no provider and cannot detect mock locations. The server marks every point that comes from a web page with flag `16`.
* Skip fixes with an accuracy over 10 000 m (desktop browsers without GPS often report tens of kilometres), and leave out `alt`, `spd` and `brg` when the browser gives `null` or `NaN`.
* `watchPosition` can fire several times a second: send at most one fix every 5 seconds. Keep batches to 50 points; a frame over 16 KiB closes the connection (`1009`).
* A refused upgrade shows up only as close code `1006`, because browsers hide its HTTP status. Get a new ticket and retry with backoff; the ticket request tells you what is wrong (`401`: refresh the token; `403 device_not_allowed`: register the browser again; `429`: wait).
* Use one connection per device. A second tab with the same device ID closes the first with `4009`; do not reconnect after `4009`.

<aside class="warning">
Keep tokens in memory, never in local storage, cookies or URLs, and refresh them one at a time. Tokens carry no name or email.
</aside>

# Staff

<aside class="warning">
The staff side is private. It runs on a separate staff host that is reachable only from the office or the VPN, and needs a token from the realm <code>staff</code>. Requests from a browser must come from the staff dashboard's origin. <code>&lt;staff host&gt;</code> below stands for that host.
</aside>

Role | Can do
---- | ------
developer | Watch live views, list devices, read location history.
admin | Everything a developer can, plus revoke devices and read the audit log.

Every live subscription and history request is recorded in the [audit log](#get-audit-log).

## Live Views

```javascript
// In the staff dashboard (a web page on the staff host)
const watchFleet = async (token) => {
    const res = await fetch('https://<staff host>/v1/ws-tickets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
    });
    const { ticket } = await res.json();

    const ws = new WebSocket(`wss://<staff host>/v1/ws?ticket=${encodeURIComponent(ticket)}`, 'rt.v1.json');
    ws.onopen = () => {
        ws.send(JSON.stringify({ v: 1, type: 'subscribe', id: 's-1', data: { sub: 'all', scope: 'fleet' } }));
    };
    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'snapshot' || msg.type === 'locations') {
            msg.data.points.forEach((p) => console.log(p.deviceId, p.lat, p.lon));
        }
    };
};
```

```shell
TICKET=$(curl -s -X POST "https://<staff host>/v1/ws-tickets" \
  -H "Authorization: Bearer $TOKEN" | jq -r .ticket)

# Then type: {"v":1,"type":"subscribe","id":"s-1","data":{"sub":"all","scope":"fleet"}}
websocat --protocol rt.v1.json "wss://<staff host>/v1/ws?ticket=$TICKET"
```

```ruby
# Staff connect from the dashboard in the browser: see the JavaScript tab.
```

```python
# Staff connect from the dashboard in the browser: see the JavaScript tab.
```

> Subscribe to the whole fleet, a map area, or one device:

```json
{ "v": 1, "type": "subscribe", "id": "s-1", "data": { "sub": "all", "scope": "fleet" } }
{ "v": 1, "type": "subscribe", "id": "s-2", "data": { "sub": "nyc", "scope": "area", "bbox": [-74.3, 40.5, -73.7, 40.95] } }
{ "v": 1, "type": "subscribe", "id": "s-3", "data": { "sub": "one", "scope": "device", "deviceId": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11" } }
```

> Updates for the view "all":

```json
{
    "v": 1,
    "type": "locations",
    "data": {
        "sub": "all",
        "points": [
            { "deviceId": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11", "t": 1791234606812,
              "lat": -33.4389, "lon": -70.6475, "acc": 6, "spd": 1.5, "brg": 120, "flags": 0 }
        ]
    }
}
```

Staff watch locations live over the private WebSocket. Like websites, they connect with a one-time ticket:

1. `POST https://<staff host>/v1/ws-tickets` with the staff access token (no body) answers `201` with `{ "ticket": "…", "expiresIn": 30 }`.
2. Open `wss://<staff host>/v1/ws?ticket=<ticket>`, offering `rt.v1.json`.

Each ticket works once and expires after 30 seconds.

### subscribe

Field | Description
----- | -----------
sub | Your name for this view, 1–32 characters. Updates carry it. Reusing a name replaces that view.
scope | `fleet` (every device), `area` (devices inside `bbox`) or `device` (one device).
bbox | For `area`: `[west, south, east, north]` in degrees.
deviceId | For `device`: the device ID.

Up to 10 views per connection; one more gets the error `too_many_subscriptions`. The server answers `ack` with `data.sub`, then sends:

Message | When | Data
------- | ---- | ----
snapshot | Right after subscribing | `sub`, and `points`: the last known position of every matching device (last 24 hours).
locations | Every second, for `fleet` and `area` views | `sub`, and `points`: the newest position of each device that moved.
location | Immediately, for `device` views | `sub`, and `point`.

If a viewer reads more slowly than updates arrive, only the newest point per device is kept for it, so it never falls behind on old positions.

### Live Point Fields

Field | Description
----- | -----------
deviceId | The device ID.
t | Fix time, epoch milliseconds.
lat / lon | Position.
acc | Accuracy in metres.
spd / brg | Speed (m/s) and bearing (degrees), when the device sent them.
flags | A bitmask of warnings, see below.

Flag | Meaning
---- | -------
1 | Mock location.
2 | Low accuracy (over 500 m).
4 | Implausible speed.
8 | The phone's clock is ahead.
16 | Sent from a web page.

### unsubscribe

`{ "v": 1, "type": "unsubscribe", "id": "u-1", "data": { "sub": "all" } }`

The server answers `ack`, or `error` with `unknown_subscription` if there is no view with that name.

## List All Devices

```ruby
require 'net/http'

uri = URI('https://<staff host>/v1/devices?limit=100')
req = Net::HTTP::Get.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

url = "https://<staff host>/v1/devices"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}

response = requests.get(url, headers=headers, params={"limit": 100})
print(response.json())
```

```shell
curl "https://<staff host>/v1/devices?limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const listAllDevices = async (after) => {
    try {
        const response = await axios.get('https://<staff host>/v1/devices', {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` },
            params: { limit: 100, after }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

listAllDevices();
```

> The above command returns JSON structured like this:

```json
{
    "devices": [
        {
            "id": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11",
            "ownerSub": "3f6b2c1e-8d4a-4e3b-9f0c-1a2b3c4d5e6f",
            "name": "Pixel 8",
            "appVersion": "1.4.0",
            "status": "active",
            "createdAt": "2026-10-05T20:00:00.000Z",
            "lastSeenAt": "2026-10-05T21:14:03.000Z"
        }
    ],
    "next": null
}
```

Returns every device, ordered by ID. Role: `developer` or `admin`. Besides the fields described in [Register Device](#register-device), each device has `ownerSub`, the Keycloak user ID of its owner.

### HTTP Request

`GET https://<staff host>/v1/devices?limit=<LIMIT>&after=<AFTER>`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
limit | 100 | How many devices to return, 1 to 500.
after | | Start after this device ID. When `next` is not `null`, pass it here to get the next page.

## Get Location History

```ruby
require 'net/http'

device_id = ENV['DEVICE_ID']
uri = URI("https://<staff host>/v1/devices/#{device_id}/locations")
uri.query = URI.encode_www_form(from: '2026-10-05T20:00:00Z', to: '2026-10-05T21:00:00Z')
req = Net::HTTP::Get.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

device_id = os.environ["DEVICE_ID"]
url = f"https://<staff host>/v1/devices/{device_id}/locations"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}
params = {"from": "2026-10-05T20:00:00Z", "to": "2026-10-05T21:00:00Z"}

response = requests.get(url, headers=headers, params=params)
print(response.json())
```

```shell
curl "https://<staff host>/v1/devices/$DEVICE_ID/locations?from=2026-10-05T20:00:00Z&to=2026-10-05T21:00:00Z" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const getHistory = async (deviceId) => {
    try {
        const response = await axios.get(`https://<staff host>/v1/devices/${deviceId}/locations`, {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` },
            params: { from: '2026-10-05T20:00:00Z', to: '2026-10-05T21:00:00Z' }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

getHistory(process.env.DEVICE_ID);
```

> The above command returns GeoJSON structured like this:

```json
{
    "type": "FeatureCollection",
    "deviceId": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11",
    "from": "2026-10-05T20:00:00.000Z",
    "to": "2026-10-05T21:00:00.000Z",
    "next": null,
    "features": [
        {
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [-70.6475, -33.4389] },
            "properties": {
                "t": "2026-10-05T20:12:31.812Z",
                "receivedAt": "2026-10-05T20:12:32.104Z",
                "acc": 6,
                "alt": 570,
                "spd": 1.5,
                "brg": null,
                "src": "fused",
                "mock": false,
                "flags": 0
            }
        }
    ]
}
```

Returns a device's stored points as a GeoJSON `FeatureCollection`, oldest first. Role: `developer` or `admin`. Coordinates are `[longitude, latitude]`, as GeoJSON requires. Each request is recorded in the audit log (who, which device, which range).

### HTTP Request

`GET https://<staff host>/v1/devices/<ID>/locations?from=<FROM>&to=<TO>&limit=<LIMIT>`

### Parameters

Parameter | Default | Description
--------- | ------- | -----------
ID | | The device ID (in the path). `404` if there is no such device.
from | 1 hour ago | Start of the range: ISO 8601 with an offset (`2026-10-05T12:00:00Z`) or epoch milliseconds.
to | now | End of the range, in the same formats. The range may be at most 24 hours.
limit | 1000 | How many points to return, at most 5000.

When `next` is not `null` there are more points: repeat the request with `from=<next>`. History goes back 30 days.

## Revoke Device

```ruby
require 'net/http'

uri = URI("https://<staff host>/v1/devices/#{ENV['DEVICE_ID']}/revoke")
req = Net::HTTP::Post.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.code
```

```python
import os
import requests

url = f"https://<staff host>/v1/devices/{os.environ['DEVICE_ID']}/revoke"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}

response = requests.post(url, headers=headers)
print(response.status_code)
```

```shell
curl -X POST "https://<staff host>/v1/devices/$DEVICE_ID/revoke" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const revoke = async (deviceId) => {
    try {
        const response = await axios.post(`https://<staff host>/v1/devices/${deviceId}/revoke`, null, {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` }
        });
        console.log(response.status);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

revoke(process.env.DEVICE_ID);
```

> The above command returns `204 No Content` with an empty body.

Revokes any device. Role: `admin`. Its WebSocket closes everywhere with code `4003`, and it can no longer connect. The action is recorded in the audit log.

### HTTP Request

`POST https://<staff host>/v1/devices/<ID>/revoke`

### URL Parameters

Parameter | Description
--------- | -----------
ID | The device ID. `404` if there is no such device.

## Get Audit Log

```ruby
require 'net/http'

uri = URI('https://<staff host>/v1/audit?limit=100')
req = Net::HTTP::Get.new(uri, 'Authorization' => "Bearer #{ENV['TOKEN']}")

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import os
import requests

url = "https://<staff host>/v1/audit"
headers = {"Authorization": f"Bearer {os.environ['TOKEN']}"}

response = requests.get(url, headers=headers, params={"limit": 100})
print(response.json())
```

```shell
curl "https://<staff host>/v1/audit?limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

```javascript
const axios = require('axios');

const getAudit = async (before) => {
    try {
        const response = await axios.get('https://<staff host>/v1/audit', {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` },
            params: { limit: 100, before }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

getAudit();
```

> The above command returns JSON structured like this:

```json
{
    "events": [
        {
            "id": "1042",
            "at": "2026-10-05T21:02:11.000Z",
            "actorSub": "9a8b7c6d-5e4f-4a3b-2c1d-0e9f8a7b6c5d",
            "actorRealm": "staff",
            "action": "history.read",
            "deviceId": "7c0e5d0a-3b52-4f4e-9a65-2f1f6f0b9d11",
            "details": { "from": "2026-10-05T20:00:00.000Z", "to": "2026-10-05T21:00:00.000Z", "count": 312 }
        }
    ],
    "next": null
}
```

Returns the audit log, newest first. Role: `admin`. Reading the log is itself recorded.

### HTTP Request

`GET https://<staff host>/v1/audit?limit=<LIMIT>&before=<BEFORE>`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
limit | 100 | How many entries to return, 1 to 500.
before | | Return entries older than this entry ID. When `next` is not `null`, pass it here to get the next page.

### Recorded Actions

Action | When
------ | ----
device.register | A device was registered.
device.revoke | A device was revoked.
live.subscribe | A staff member subscribed to a live view (with its scope and area).
history.read | A staff member read a device's location history (with the range).
audit.read | An admin read the audit log.

Entries say who did what, when, to which device, and the scope or range. They never contain coordinates. They are kept for 12 months.
