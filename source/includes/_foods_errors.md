# Errors

> Error response:

```json
{
    "message": "Product not found"
}
```

> Open Food Facts refused a change (502):

```json
{
    "message": "Open Food Facts rejected the request",
    "details": "This picture has already been sent."
}
```

The Food API uses the following status codes:

Status Code | Meaning
----------- | -------
400 | Bad Request -- The request is not valid: a barcode that is not 8 to 14 digits, an unknown or wrongly typed field, malformed JSON, or a photo that is missing, too large or not JPEG, PNG or GIF. `message` says what to fix.
401 | Unauthorized -- The `Authorization` header is missing or is not `Bearer <token>`. See [Authentication](#authentication).
403 | Forbidden -- The token is invalid or expired.
404 | Not Found -- Open Food Facts has no product with that barcode, or, for [Ingredients from Photo](#ingredients-from-photo), the product has no ingredients photo in that language.
409 | Conflict -- [Create Product](#create-product) was called for a barcode that Open Food Facts already has. Use [Update Product](#update-product) instead.
413 | Payload Too Large -- The JSON body is larger than 100 KB.
500 | Internal Server Error -- The request could not be completed, for example because Open Food Facts could not be reached. Try again later.
502 | Bad Gateway -- Open Food Facts received the change but refused it. Its reason is in `details`.

Errors carry a short text in `message`. A `502` also has `details`, with the reason given by Open Food Facts.

<aside class="notice">
When you retry after a <code>500</code>, wait a few seconds first and wait longer after each new failure. Do not retry a <code>4xx</code> or a <code>502</code> unchanged: fix the request first.
</aside>

<aside class="warning">
A path that does not exist, such as a misspelled endpoint, returns an HTML error page ("Cannot GET …") with status <code>404</code> instead of JSON.
</aside>
