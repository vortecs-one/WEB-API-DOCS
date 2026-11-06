# Errors

> Validation error (400):

```json
{
    "errors": [
        {
            "type": "field",
            "value": "",
            "msg": "Invalid value",
            "path": "name",
            "location": "body"
        }
    ]
}
```

> Validation error from the /human endpoints (400):

```json
{
    "success": false,
    "errors": [
        {
            "type": "field",
            "value": "14-05-1990",
            "msg": "Invalid value",
            "path": "birthdate",
            "location": "body"
        }
    ]
}
```

> Any other error:

```json
{
    "error": "Invalid token"
}
```

The Humans API uses the following status codes:

Status Code | Meaning
----------- | -------
400 | Bad Request -- A parameter is missing or invalid, or the body is not valid JSON.
401 | Unauthorized -- The Authorization header is missing or malformed, or the credentials are wrong.
403 | Forbidden -- The token is invalid, expired or belongs to the wrong account, or the user account is inactive.
404 | Not Found -- The requested record does not exist.
409 | Conflict -- The email is already registered on that platform.
429 | Too Many Requests -- Too many login attempts. Wait 15 minutes and try again.
500 | Internal Server Error -- The request could not be completed. This includes duplicate values in unique fields, such as a human's `unique_id`.

Validation errors (400) list every invalid field: `path` is the field name and `location` says where it was sent (`body`, `params` or `query`).

Other errors carry a short text in `error` or `message`, for example `{"error": "Invalid token"}` or `{"message": "Not found"}`. The `/human` endpoints also include `"success": false`.

<aside class="warning">
Upload errors (a file type that is not allowed, or a file over the size limit) and bodies that are not valid JSON currently return an HTML error page instead of JSON.
</aside>
