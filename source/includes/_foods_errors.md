# Errors

> Error response:

```json
{
    "message": "Product not found"
}
```

The Food API uses the following status codes:

Status Code | Meaning
----------- | -------
404 | Not Found -- Open Food Facts has no product with that barcode.
500 | Internal Server Error -- The product could not be retrieved, for example because Open Food Facts could not be reached. Try again later.

Errors carry a short text in `message`.

<aside class="warning">
A path that does not exist, such as a misspelled endpoint, returns an HTML error page ("Cannot GET …") with status <code>404</code> instead of JSON.
</aside>
