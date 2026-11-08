# Errors

## REST Errors

> Error response:

```json
{
    "error": "device_not_allowed"
}
```

> Validation error:

```json
{
    "error": "invalid_request",
    "fields": ["deviceId"]
}
```

REST errors carry a short code in `error`. Validation errors also list the invalid fields in `fields`.

Status Code | Error | Meaning
----------- | ----- | -------
400 | `invalid_request` | A parameter is missing or invalid. `fields` says which.
400 | `invalid_json` | The body is not valid JSON.
401 | `missing_token`, `invalid_token`, `expired_token` | The token is missing, invalid or expired. Refresh it and retry.
403 | `forbidden` | The token lacks the role this endpoint needs.
403 | `origin_not_allowed` | The request came from a website that is not allowed.
403 | `device_not_allowed` | The ticket was asked for a device that is not one of the user's active devices.
404 | `not_found` | No such device, or no such endpoint.
409 | `device_limit` | The user already has 3 active devices (`max` says how many are allowed).
413 | `too_large` | The body is over 8 KB.
429 | `rate_limited` | Too many requests. Wait for the number of seconds in the `Retry-After` header.
500 | `internal` | Server problem. Try again later.

## WebSocket Error Codes

> Error message on the WebSocket:

```json
{ "v": 1, "type": "error", "ref": "m-1842", "data": { "code": "invalid_message" } }
```

An `error` message answers the message whose `id` is in `ref`. Nothing from that message was stored.

Code | Meaning
---- | -------
invalid_message | Not valid JSON, or does not match the message's schema.
unsupported_type | Unknown message type, or a type this endpoint does not accept.
rate_limited | Sending too fast: about 1 message per second, bursts of 10.
auth_failed | `auth.refresh` carried an invalid token, or a token for another user.
too_many_subscriptions | A staff connection already has 10 live views.
unknown_subscription | `unsubscribe` named a view that does not exist.
internal | Server problem. Retry later.

## WebSocket Close Codes

Code | Meaning | What the client should do
---- | ------- | -------------------------
1000 | Normal close | Nothing.
1003 | A binary frame was sent | Send text frames only.
1006 | The connection dropped, or a browser's upgrade was refused | Reconnect with backoff. A website gets a new ticket first.
1008 | Too many invalid or rate-limited messages | Fix the client, then reconnect with backoff.
1009 | A frame was larger than 16 KiB | Send smaller batches.
1012 | Server restarting | Reconnect after a random 1–5 second delay.
1013 | The client reads too slowly | Reconnect with backoff.
4001 | Access token expired | Refresh the token, then reconnect.
4003 | Device revoked, or the session ended | Do not retry; the user must log in again.
4009 | The same device opened a newer connection | Do not reconnect from this connection.

<aside class="warning">
Reconnect with exponential backoff and some randomness, so that thousands of phones do not all reconnect at the same moment after a server restart.
</aside>
