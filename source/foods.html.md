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

The product data comes from [Open Food Facts](https://world.openfoodfacts.org), an open database of food products. A result is only as complete as the product's entry there.

The documentation has code examples in Shell, Ruby, Python and JavaScript. The JavaScript examples run on Node.js with the `axios` package.

Conventions used by every endpoint:

* Responses are JSON.
* No token is needed: every endpoint is public.

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
A barcode that Open Food Facts does not know returns <code>404</code> with <code>{"message": "Product not found"}</code>.
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
