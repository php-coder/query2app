#
# Tests for basic CRUD operations
#
# How to run:
# hurl --variable SERVER_URL=http://127.0.0.1:3000 crud.hurl --test
#
# See also: https://hurl.dev and https://github.com/Orange-OpenSource/hurl
#


# POST should create an object
POST {{ SERVER_URL }}/v1/categories
{
    "name":    "Sport",
    "slug":    "sport",
    "hidden":  true,
    "user_id": 1
}
HTTP 204

# ensures that it was created
GET {{ SERVER_URL }}/v1/categories/count
HTTP 200
[Asserts]
jsonpath "$.counter" == 1


# GET should return a value
GET {{ SERVER_URL }}/v1/categories/1
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.id"      == 1
jsonpath "$.name"    == "Sport"
jsonpath "$.name_ru" == null
jsonpath "$.slug"    == "sport"
jsonpath "$.hidden"  == true


# GET should return a list of values
GET {{ SERVER_URL }}/v1/categories
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$" count      == 1
jsonpath "$[0].id"      == 1
jsonpath "$[0].name"    == "Sport"
jsonpath "$[0].name_ru" == null
jsonpath "$[0].slug"    == "sport"
jsonpath "$[0].hidden"  == true

GET {{ SERVER_URL }}/v1/categories/search?hidden=true
HTTP 200
[Asserts]
jsonpath "$" count     == 1
jsonpath "$[0].name"   == "Sport"
jsonpath "$[0].hidden" == true


# PUT should update an object
PUT {{ SERVER_URL }}/v1/categories/1
{
    "name":    "Fauna",
    "name_ru": "Фауна",
    "slug":    "fauna",
    "hidden":  false,
    "user_id": 1
}
HTTP 204

# ensures that it was updated
GET {{ SERVER_URL }}/v1/categories/1
HTTP 200
[Asserts]
header "Content-Type" contains "application/json"
jsonpath "$.name"     == "Fauna"
jsonpath "$.name_ru"  == "Фауна"
jsonpath "$.slug"     == "fauna"
jsonpath "$.hidden"   == false

GET {{ SERVER_URL }}/v1/categories/search?hidden=false
HTTP 200
[Asserts]
jsonpath "$" count     == 1
jsonpath "$[0].name"   == "Fauna"
jsonpath "$[0].hidden" == false


# DELETE should remove an object
DELETE {{ SERVER_URL }}/v1/categories/1
HTTP 204

# ensures that it was removed
GET {{ SERVER_URL }}/v1/categories/1
HTTP 404
