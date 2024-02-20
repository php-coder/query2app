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
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.id"      == 1
jsonpath "$.name"    == "Sport"
jsonpath "$.name_ru" == null
jsonpath "$.slug"    == "sport"


# GET should return a list of values
GET {{ SERVER_URL }}/v1/categories
HTTP 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$" count      == 1
jsonpath "$[0].id"      == 1
jsonpath "$[0].name"    == "Sport"
jsonpath "$[0].name_ru" == null
jsonpath "$[0].slug"    == "sport"


# PUT should update an object
PUT {{ SERVER_URL }}/v1/categories/1
{
    "name":    "Fauna",
    "name_ru": "Фауна",
    "slug":    "fauna",
    "user_id": 1
}
HTTP 204

# ensures that it was updated
GET {{ SERVER_URL }}/v1/categories/1
HTTP 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.name"     == "Fauna"
jsonpath "$.name_ru"  == "Фауна"
jsonpath "$.slug"     == "fauna"


# DELETE should remove an object
DELETE {{ SERVER_URL }}/v1/categories/1
HTTP 204

# ensures that it was removed
GET {{ SERVER_URL }}/v1/categories/1
HTTP 404
