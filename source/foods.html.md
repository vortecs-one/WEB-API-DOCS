---
title: Thruxion API - Food

# Label shown in the top menu that switches between the API docs
menu_title: Food API

language_tabs: # must be one of https://github.com/rouge-ruby/rouge/wiki/List-of-supported-languages-and-lexers
  - shell
  - ruby
  - python
  - javascript

toc_footers:
  - <a href='https://github.com/slatedocs/slate'>Documentation Powered by Slate</a>

includes:
  - foods_errors

search: true

code_clipboard: true

meta:
  - name: description
    content: Documentation for the Food API
---

# Thruxion - Food API

API URL: https://thruxion.com/api/foods/

The Food API looks up packaged food products by their barcode. For each product it returns the name, brand, a photo, the ingredients, the countries where it is sold, whether it is vegan or vegetarian, and its nutrition facts.

The product data comes from [Open Food Facts](https://world.openfoodfacts.org), an open database of food products. A result is only as complete as the product's entry there. When a product is missing or incomplete, you can [add it](#create-product), [complete it](#update-product), [send photos of it](#upload-product-photo) and [read its ingredients from a photo](#ingredients-from-photo) through this API.

The documentation has code examples in Shell, Ruby, Python and JavaScript. The JavaScript examples run on Node.js with the `axios` package, plus `form-data` for photo uploads.

Conventions used by every endpoint:

* Requests and responses are JSON. Photo uploads use `multipart/form-data`.
* Looking products up needs no token. Adding, changing and photographing products, and reading ingredients from a photo, need a token in the `Authorization` header, as `Bearer <token>`. See [Authentication](#authentication).
* Barcodes in the path are digits only, for example an EAN-13 such as `3017624010701`.

<aside class="warning">
What you add or change is published on Open Food Facts for everyone to see and reuse: product data under the Open Database License, photos under Creative Commons Attribution-ShareAlike. Send only real product information, and only photos you have the right to share.
</aside>

# Authentication

The endpoints that write to Open Food Facts ([Create Product](#create-product), [Update Product](#update-product) and [Upload Product Photo](#upload-product-photo)), and [Ingredients from Photo](#ingredients-from-photo), need a JSON Web Token (JWT). It is the same token the Humans API gives: get one from the Humans API [System Login](humans.html#system-login), then send it in the `Authorization` header:

`Authorization: Bearer <token>`

Tokens from both system accounts, **admin** and **dev**, are accepted. A token expires after 2 hours; log in again to get a new one.

Your requests reach Open Food Facts through Thruxion's own Open Food Facts account, so you do not need an Open Food Facts account yourself.

A request with a missing or rejected token gets one of these errors:

Status | Body | Reason
------ | ---- | ------
401 | `{"message": "Access denied"}` | No Authorization header.
401 | `{"message": "Invalid Authorization format"}` | The header is not `Bearer <token>`.
403 | `{"message": "Invalid token"}` | The token is invalid or expired.

# Products

## Get Product by Barcode

```ruby
require 'net/http'
require 'json'

barcode = '3017624010701'  # Replace with the product's barcode

uri = URI("https://thruxion.com/api/foods/barcode/#{barcode}")
req = Net::HTTP::Get.new(uri)

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

barcode = "3017624010701"  # Replace with the product's barcode
url = f"https://thruxion.com/api/foods/barcode/{barcode}"

response = requests.get(url)
print(response.json())
```

```shell
# Replace 3017624010701 with the product's barcode
curl "https://thruxion.com/api/foods/barcode/3017624010701"
```

```javascript
const axios = require('axios');

const getProductByBarcode = async (barcode) => {
    try {
        const response = await axios.get(`https://thruxion.com/api/foods/barcode/${barcode}`);
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

getProductByBarcode('3017624010701'); // Replace with the product's barcode
```

> The above command returns JSON structured like this. The nutriments are shortened here; the full object has many more keys:

```json
{
    "barcode": "3017624010701",
    "name": "Nutella",
    "brand": "Ferrero",
    "image": "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.100.400.jpg",
    "ingredients": "sugar, palm oil, hazelnuts, skimmed milk powder, fat reduced cocoa, emulsifier, vanillin",
    "countries": [
        "Frankreich",
        "Vereinigtes Königreich"
    ],
    "vegan": "no",
    "vegetarian": "no",
    "nutriments": {
        "energy-kcal_100g": 539,
        "energy-kcal_unit": "kcal",
        "energy-kcal_value": 539,
        "energy-kj_100g": 2228,
        "fat_100g": 30.9,
        "saturated-fat_100g": 10.6,
        "carbohydrates_100g": 57.5,
        "sugars_100g": 56.3,
        "proteins_100g": 6.3,
        "salt_100g": 0.1075,
        "salt_unit": "g",
        "sodium_100g": 0.043
    }
}
```

> Barcode not found (404):

```json
{
    "message": "Product not found"
}
```

This endpoint returns a product's details and nutrition facts, looked up by its barcode in Open Food Facts. It needs no token.

### HTTP Request

`GET https://thruxion.com/api/foods/barcode/<BARCODE>`

### URL Parameters

Parameter | Description
--------- | -----------
BARCODE | The barcode printed on the product, as digits, for example an EAN-13 such as `3017624010701` or a UPC.

### Response

Field | Type | Description
----- | ---- | -----------
barcode | string | The barcode from the request.
name | string | Product name, or `"N/A"` if Open Food Facts has none.
brand | string | Brand, or several brands separated by commas. `"N/A"` if unknown.
image | string | URL of a photo of the product's front, or `""` if there is none.
ingredients | string | Ingredient list as printed on the package, or `"N/A"` if unknown. It can be in any language.
countries | array of strings | Countries where the product is sold, as recorded in Open Food Facts. The names can be in any language. Empty if unknown.
vegan | string | `"yes"` or `"no"`. See the warning below.
vegetarian | string | `"yes"` or `"no"`. See the warning below.
nutriments | object | Nutrition facts, exactly as Open Food Facts returns them. Which nutrients are present depends on the product.

The keys in `nutriments` follow the Open Food Facts naming:

* `<nutrient>_100g`: amount per 100 g or 100 ml, for example `sugars_100g`. Use these to compare products.
* `<nutrient>_unit` and `<nutrient>_value`: the unit and amount as entered for the product.
* `<nutrient>`: the amount in the default unit (grams for nutrients, kJ for `energy`, kcal for `energy-kcal`).

<aside class="warning">
<code>vegan</code> and <code>vegetarian</code> are estimates. They come from the Open Food Facts analysis of the ingredients. When that analysis is not available, the API looks for words such as "vegan" or "vegetarian" in the product name and keywords. A <code>"no"</code> can therefore also mean the status is unknown. Check the ingredients before relying on it.
</aside>

<aside class="notice">
A barcode that Open Food Facts does not know returns <code>404</code> with <code>{"message": "Product not found"}</code>. You can add it with <a href="#create-product">Create Product</a>.
</aside>

## Create Product

```ruby
require 'net/http'
require 'json'

barcode = '8412345678905'  # Replace with the product's barcode

uri = URI("https://thruxion.com/api/foods/barcode/#{barcode}")
req = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json', 'Authorization' => 'Bearer YOUR_JWT_TOKEN')
req.body = {
  name: 'Oat and Honey Bar',
  brand: 'Acme',
  quantity: '40 g',
  categories: ['Snacks', 'Cereal bars'],
  ingredients: 'oat flakes 60%, honey 25%, sunflower oil, salt',
  countries: ['Spain'],
  lang: 'en',
  nutrition_data_per: '100g',
  nutriments: {
    'energy-kcal' => 410,
    'fat' => 12.5,
    'saturated-fat' => 1.8,
    'carbohydrates' => 64,
    'sugars' => 24,
    'fiber' => 6.5,
    'proteins' => 8.2,
    'salt' => 0.3
  }
}.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

barcode = "8412345678905"  # Replace with the product's barcode
url = f"https://thruxion.com/api/foods/barcode/{barcode}"
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "name": "Oat and Honey Bar",
    "brand": "Acme",
    "quantity": "40 g",
    "categories": ["Snacks", "Cereal bars"],
    "ingredients": "oat flakes 60%, honey 25%, sunflower oil, salt",
    "countries": ["Spain"],
    "lang": "en",
    "nutrition_data_per": "100g",
    "nutriments": {
        "energy-kcal": 410,
        "fat": 12.5,
        "saturated-fat": 1.8,
        "carbohydrates": 64,
        "sugars": 24,
        "fiber": 6.5,
        "proteins": 8.2,
        "salt": 0.3
    }
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

```shell
# Replace 8412345678905 with the product's barcode
curl -X POST "https://thruxion.com/api/foods/barcode/8412345678905" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Oat and Honey Bar",
    "brand": "Acme",
    "quantity": "40 g",
    "categories": ["Snacks", "Cereal bars"],
    "ingredients": "oat flakes 60%, honey 25%, sunflower oil, salt",
    "countries": ["Spain"],
    "lang": "en",
    "nutrition_data_per": "100g",
    "nutriments": {
      "energy-kcal": 410,
      "fat": 12.5,
      "saturated-fat": 1.8,
      "carbohydrates": 64,
      "sugars": 24,
      "fiber": 6.5,
      "proteins": 8.2,
      "salt": 0.3
    }
  }'
```

```javascript
const axios = require('axios');

const createProduct = async (token, barcode) => {
    const data = {
        name: 'Oat and Honey Bar',
        brand: 'Acme',
        quantity: '40 g',
        categories: ['Snacks', 'Cereal bars'],
        ingredients: 'oat flakes 60%, honey 25%, sunflower oil, salt',
        countries: ['Spain'],
        lang: 'en',
        nutrition_data_per: '100g',
        nutriments: {
            'energy-kcal': 410,
            fat: 12.5,
            'saturated-fat': 1.8,
            carbohydrates: 64,
            sugars: 24,
            fiber: 6.5,
            proteins: 8.2,
            salt: 0.3
        }
    };
    try {
        const response = await axios.post(`https://thruxion.com/api/foods/barcode/${barcode}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

createProduct('YOUR_JWT_TOKEN', '8412345678905'); // Replace with the product's barcode
```

> The above command returns JSON structured like this (201):

```json
{
    "barcode": "8412345678905",
    "message": "Product created",
    "url": "https://world.openfoodfacts.org/product/8412345678905"
}
```

> Barcode already in Open Food Facts (409):

```json
{
    "message": "Product already exists",
    "barcode": "8412345678905"
}
```

> Invalid request (400), for example a misspelled field:

```json
{
    "message": "Unknown field(s): nmae. Accepted fields: name, brand, quantity, categories, labels, countries, ingredients, serving_size, nutrition_data_per, nutriments, comment, lang"
}
```

This endpoint adds a product to Open Food Facts, but only if its barcode is not there yet. To change a product that already exists, use [Update Product](#update-product).

Only `name` is required, but send what you can read on the package. Open Food Facts calculates more data from it: the Nutri-Score needs the nutrition facts and a category, and the NOVA group, additives and allergens need the ingredients. A [front photo](#upload-product-photo) helps other people recognize the product.

### HTTP Request

`POST https://thruxion.com/api/foods/barcode/<BARCODE>`

### Parameters

Parameter | In | Type | Required | Description
--------- | -- | ---- | -------- | -----------
BARCODE | path | string | Yes | The barcode printed on the product: 8 to 14 digits, for example an EAN-13 or a UPC.
name | body | string | Yes | Product name, in the language given by `lang`.
brand | body | string or array | No | Brand. Send several as an array of strings, or as one string separated by commas.
quantity | body | string | No | Net quantity with its unit, as printed, for example `"40 g"` or `"1 l"`.
categories | body | string or array | No | Categories, from general to specific, for example `["Snacks", "Cereal bars"]`. Open Food Facts matches them to its own category list.
labels | body | string or array | No | Labels and certifications, for example `["Organic", "Gluten-free"]`.
countries | body | string or array | No | Countries where the product is sold.
ingredients | body | string | No | Ingredient list as printed on the package, in the language given by `lang`.
serving_size | body | string | No | Size of one serving, for example `"40 g"`.
nutrition_data_per | body | string | No | `"100g"` if the values in `nutriments` are per 100 g or 100 ml, `"serving"` if they are per serving. Send it together with `nutriments`.
nutriments | body | object | No | Nutrition facts, see below.
lang | body | string | No | Two-letter code of the language `name` and `ingredients` are written in, such as `en` or `es`. Default `en`. It also becomes the product's main language.
comment | body | string | No | A note shown in the product's edit history on Open Food Facts.

Any other field is refused with `400`, so a misspelled name is not silently ignored. Texts can be up to 5000 characters.

`nutriments` uses the Open Food Facts nutrient names, the same as in the [Get Product by Barcode](#get-product-by-barcode) answer but without the `_100g` ending:

* `<nutrient>`: the amount, as a number of 0 or more. Common names are `energy-kcal`, `energy-kj`, `fat`, `saturated-fat`, `carbohydrates`, `sugars`, `fiber`, `proteins`, `salt` and `sodium`.
* `<nutrient>_unit`: optional unit for that amount, for example `"sodium_unit": "mg"`. Without it, the default unit is used: grams for nutrients, kJ for `energy-kj` and kcal for `energy-kcal`.

### Response

Field | Type | Description
----- | ---- | -----------
barcode | string | The barcode from the request.
message | string | `"Product created"`.
url | string | The product's page on Open Food Facts.

<aside class="notice">
The new product is right away returned by <a href="#get-product-by-barcode">Get Product by Barcode</a>. Values calculated by Open Food Facts, such as <code>vegan</code> and <code>vegetarian</code>, are based on what you sent.
</aside>

## Update Product

```ruby
require 'net/http'
require 'json'

barcode = '8412345678905'  # Replace with the product's barcode

uri = URI("https://thruxion.com/api/foods/barcode/#{barcode}")
req = Net::HTTP::Patch.new(uri, 'Content-Type' => 'application/json', 'Authorization' => 'Bearer YOUR_JWT_TOKEN')
req.body = {
  quantity: '45 g',
  labels: ['Organic'],
  comment: 'New package size'
}.to_json

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

barcode = "8412345678905"  # Replace with the product's barcode
url = f"https://thruxion.com/api/foods/barcode/{barcode}"
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "quantity": "45 g",
    "labels": ["Organic"],
    "comment": "New package size"
}

response = requests.patch(url, headers=headers, json=data)
print(response.json())
```

```shell
# Replace 8412345678905 with the product's barcode
curl -X PATCH "https://thruxion.com/api/foods/barcode/8412345678905" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": "45 g",
    "labels": ["Organic"],
    "comment": "New package size"
  }'
```

```javascript
const axios = require('axios');

const updateProduct = async (token, barcode) => {
    const data = {
        quantity: '45 g',
        labels: ['Organic'],
        comment: 'New package size'
    };
    try {
        const response = await axios.patch(`https://thruxion.com/api/foods/barcode/${barcode}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

updateProduct('YOUR_JWT_TOKEN', '8412345678905'); // Replace with the product's barcode
```

> The above command returns JSON structured like this:

```json
{
    "barcode": "8412345678905",
    "message": "Product updated",
    "updated": [
        "quantity",
        "labels"
    ]
}
```

> Barcode not in Open Food Facts (404):

```json
{
    "message": "Product not found"
}
```

This endpoint changes a product that is already in Open Food Facts, for example to add the nutrition facts or the ingredients that are missing. Send only the fields you want to change. To add a product that is not there yet, use [Create Product](#create-product).

### HTTP Request

`PATCH https://thruxion.com/api/foods/barcode/<BARCODE>`

### Parameters

The fields are the same as for [Create Product](#create-product), but none is required: send at least one of `name`, `brand`, `quantity`, `categories`, `labels`, `countries`, `ingredients`, `serving_size`, `nutrition_data_per` or `nutriments`. You can add `comment` to explain the change.

Parameter | In | Type | Required | Description
--------- | -- | ---- | -------- | -----------
BARCODE | path | string | Yes | The barcode printed on the product: 8 to 14 digits.
lang | body | string | No | Two-letter code of the language `name` and `ingredients` are written in. Default: the product's main language. The main language itself does not change.

<aside class="warning">
Every field you send replaces the value Open Food Facts has. For <code>brand</code>, <code>categories</code>, <code>labels</code> and <code>countries</code>, send the complete list, not only the new items. If you change <code>nutrition_data_per</code>, send all of the nutrition facts again, so that values per 100 g and per serving are not mixed.
</aside>

### Response

Field | Type | Description
----- | ---- | -----------
barcode | string | The barcode from the request.
message | string | `"Product updated"`.
updated | array of strings | The fields that were sent to Open Food Facts, without `lang` and `comment`.

## Upload Product Photo

```ruby
require 'net/http'
require 'json'

barcode = '8412345678905'  # Replace with the product's barcode

uri = URI("https://thruxion.com/api/foods/barcode/#{barcode}/images")
req = Net::HTTP::Post.new(uri, 'Authorization' => 'Bearer YOUR_JWT_TOKEN')
req.set_form(
  [['type', 'front'],
   ['lang', 'en'],
   ['image', File.open('front.jpg'), { filename: 'front.jpg', content_type: 'image/jpeg' }]],
  'multipart/form-data'
)

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

barcode = "8412345678905"  # Replace with the product's barcode
url = f"https://thruxion.com/api/foods/barcode/{barcode}/images"
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "type": "front",
    "lang": "en"
}
files = {
    "image": ("front.jpg", open("front.jpg", "rb"), "image/jpeg")
}

response = requests.post(url, headers=headers, data=data, files=files)
print(response.json())
```

```shell
# Replace 8412345678905 with the product's barcode
curl -X POST "https://thruxion.com/api/foods/barcode/8412345678905/images" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "type=front" \
  -F "lang=en" \
  -F "image=@front.jpg;type=image/jpeg"
```

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const uploadProductPhoto = async (token, barcode) => {
    const form = new FormData();
    form.append('type', 'front');
    form.append('lang', 'en');
    form.append('image', fs.createReadStream('front.jpg'), { contentType: 'image/jpeg' });
    try {
        const response = await axios.post(`https://thruxion.com/api/foods/barcode/${barcode}/images`, form, {
            headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

uploadProductPhoto('YOUR_JWT_TOKEN', '8412345678905'); // Replace with the product's barcode
```

> The above command returns JSON structured like this (201):

```json
{
    "barcode": "8412345678905",
    "type": "front",
    "imagefield": "front_en",
    "imgid": 1,
    "message": "Image uploaded"
}
```

> Photo refused by Open Food Facts (502):

```json
{
    "message": "Open Food Facts rejected the request",
    "details": "This picture has already been sent."
}
```

This endpoint sends a photo of a product to Open Food Facts. Send it as `multipart/form-data`. The product must already be in Open Food Facts; add it first with [Create Product](#create-product) if it is not.

Photos are the most useful thing to send: Open Food Facts volunteers and its automatic text recognition read them to fill in the data that is still missing. Take each photo straight on, in focus, with the whole panel visible.

### HTTP Request

`POST https://thruxion.com/api/foods/barcode/<BARCODE>/images`

### Parameters

Parameter | In | Type | Required | Description
--------- | -- | ---- | -------- | -----------
BARCODE | path | string | Yes | The barcode printed on the product: 8 to 14 digits.
image | form | file | Yes | The photo: JPEG, PNG or GIF, up to 10 MB and at least 640 × 160 pixels.
type | form | string | Yes | What the photo shows: `front`, `ingredients`, `nutrition` (the nutrition facts table), `packaging` (recycling information) or `other`.
lang | form | string | No | Two-letter code of the language of the text on the photo. Default `en`. Not used for `other`.

### Response

Field | Type | Description
----- | ---- | -----------
barcode | string | The barcode from the request.
type | string | The `type` from the request.
imagefield | string | Where Open Food Facts stores the photo: `type` and language together, such as `front_en`, or `other`.
imgid | integer | Number of the photo among all photos of the product on Open Food Facts.
message | string | `"Image uploaded"`.

<aside class="notice">
Open Food Facts checks the photo itself, and can refuse one that is too small or that was already sent. The API then answers <code>502</code> and gives Open Food Facts' reason in <code>details</code>. Sending a new photo of a type that already has one keeps the old photo too.
</aside>

## Ingredients from Photo

```ruby
require 'net/http'
require 'json'

barcode = '3017624010701'  # Replace with the product's barcode

uri = URI("https://thruxion.com/api/foods/barcode/#{barcode}/ingredients-from-photo?lang=en")
req = Net::HTTP::Get.new(uri, 'Authorization' => 'Bearer YOUR_JWT_TOKEN')

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

barcode = "3017624010701"  # Replace with the product's barcode
url = f"https://thruxion.com/api/foods/barcode/{barcode}/ingredients-from-photo"
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
params = {"lang": "en"}

response = requests.get(url, headers=headers, params=params)
print(response.json())
```

```shell
# Replace 3017624010701 with the product's barcode
curl "https://thruxion.com/api/foods/barcode/3017624010701/ingredients-from-photo?lang=en" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

```javascript
const axios = require('axios');

const ingredientsFromPhoto = async (token, barcode) => {
    try {
        const response = await axios.get(`https://thruxion.com/api/foods/barcode/${barcode}/ingredients-from-photo`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { lang: 'en' }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

ingredientsFromPhoto('YOUR_JWT_TOKEN', '3017624010701'); // Replace with the product's barcode
```

> The above command returns JSON structured like this:

```json
{
    "barcode": "3017624010701",
    "lang": "en",
    "ingredients": "Sugar, Palm Oil, HAZELNUTS (13%), Skimmed MILK Powder (8.7%), Fat-Reduced Cocoa (7.4%), Emulsifier: Lecithins (SOYA), Vanillin. Gluten free. SUITABLE FOR VEGETARIANS.",
    "source": "ocr"
}
```

> No ingredients photo in the requested language (404):

```json
{
    "message": "No ingredients photo in es",
    "available": [
        "en"
    ]
}
```

This endpoint reads the ingredient list from the product's ingredients photo with text recognition (OCR), run by Open Food Facts. It is the quickest way to fill in missing ingredients: [upload a photo](#upload-product-photo) with `type=ingredients`, call this endpoint, check the text, then save it with [Update Product](#update-product), sending it as `ingredients` with the same `lang`.

This endpoint saves nothing: the product on Open Food Facts stays as it is.

### HTTP Request

`GET https://thruxion.com/api/foods/barcode/<BARCODE>/ingredients-from-photo`

### Parameters

Parameter | In | Type | Required | Description
--------- | -- | ---- | -------- | -----------
BARCODE | path | string | Yes | The barcode printed on the product: 8 to 14 digits.
lang | query | string | No | Two-letter code of the language of the ingredients photo to read, such as `en`. Default: the product's main language if it has an ingredients photo in it, otherwise the first language that has one.

### Response

Field | Type | Description
----- | ---- | -----------
barcode | string | The barcode from the request.
lang | string | The language of the photo that was read.
ingredients | string | The text read from the photo.
source | string | Always `"ocr"`: the text was read by a machine, not typed by a person.

A product without an ingredients photo, or without one in the requested `lang`, gets `404` with the languages that do have one in `available`. If no text can be read from the photo, the answer is `502`, with the reason in `details`.

<aside class="warning">
The text is read by a machine and can contain mistakes, such as misread words or text from around the ingredient list. Check it against the package before saving it, and do not translate it: save it in the language of the photo.
</aside>

# Health

Check whether the API is running.

## Health Check

```ruby
require 'net/http'
require 'json'

uri = URI('https://thruxion.com/api/foods/health')
req = Net::HTTP::Get.new(uri)

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

url = "https://thruxion.com/api/foods/health"

response = requests.get(url)
print(response.json())
```

```shell
curl "https://thruxion.com/api/foods/health"
```

```javascript
const axios = require('axios');

const healthCheck = async () => {
    try {
        const response = await axios.get('https://thruxion.com/api/foods/health');
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

healthCheck();
```

> The above command returns JSON structured like this:

```json
{
    "status": "UP"
}
```

This endpoint answers `200` while the API is running. It needs no token.

### HTTP Request

`GET https://thruxion.com/api/foods/health`

## Service Status

```ruby
require 'net/http'
require 'json'

uri = URI('https://thruxion.com/api/foods/')
req = Net::HTTP::Get.new(uri)

res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
puts res.body
```

```python
import requests

url = "https://thruxion.com/api/foods/"

response = requests.get(url)
print(response.json())
```

```shell
curl "https://thruxion.com/api/foods/"
```

```javascript
const axios = require('axios');

const serviceStatus = async () => {
    try {
        const response = await axios.get('https://thruxion.com/api/foods/');
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
};

serviceStatus();
```

> The above command returns JSON structured like this:

```json
{
    "service": "Food API",
    "status": "running"
}
```

This endpoint returns the name of the service and whether it is running. It needs no token.

### HTTP Request

`GET https://thruxion.com/api/foods/`
