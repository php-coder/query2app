#
# Tests for various operations
#
# How to run:
# hurl --variable SERVER_URL=http://127.0.0.1:3000 misc.hurl --test
#


# Custom route
GET {{ SERVER_URL }}/custom/route
HTTP 200
[Asserts]
jsonpath "$.custom" == true
