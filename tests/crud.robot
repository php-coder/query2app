*** Settings ***
Documentation   Basic CRUD operations
Library         Collections
Library         RequestsLibrary
Suite Setup     Create Session  alias=api  url=${SERVER_URL}
Suite Teardown  Delete All Sessions

*** Variables ***
${SERVER_URL}  http://host.docker.internal:3000

** Test Cases ***
POST should create an object
    &{payload}=                     Create Dictionary  name=Sport  slug=sport  user_id=1
    ${response}=                    Post Request  api  /v1/categories  json=${payload}
    Status Should Be                204  ${response}
    # checks that it was created
    ${response}=                    Get Request  api  /v1/categories/count
    Status Should Be                200  ${response}
    Dictionary Should Contain Item  ${response.json()}  counter  1

GET should return a value
    ${response}=                  Get Request  api  /v1/categories/1
    ${body}=                      Set Variable  ${response.json()}
    Status Should Be              200  ${response}
    Should Be Equal               ${response.headers['Content-Type']}  application/json; charset=utf-8
    &{expected}=                  Create Dictionary  id=${1}  name=Sport  name_ru=${null}  slug=sport
    Dictionaries Should Be Equal  ${body}  ${expected}

GET should return a list of values
    ${response}=                  Get Request  api  /v1/categories
    ${body}=                      Set Variable  ${response.json()}
    Status Should Be              200  ${response}
    Should Be Equal               ${response.headers['Content-Type']}  application/json; charset=utf-8
    &{expected}=                  Create Dictionary  id=${1}  name=Sport  name_ru=${null}  slug=sport
    Length Should Be              ${body}     1
    Dictionaries Should Be Equal  ${body[0]}  ${expected}

PUT should update an object
    &{payload}=                     Create Dictionary  name=Fauna  name_ru=Фауна  slug=fauna  user_id=1
    ${response}=                    Put Request  api  /v1/categories/1  json=${payload}
    Status Should Be                204  ${response}
    # checks that it was updated
    ${response}=                    Get Request  api  /v1/categories/1
    ${body}=                        Set Variable  ${response.json()}
    Status Should Be                200  ${response}
    Should Be Equal                 ${response.headers['Content-Type']}  application/json; charset=utf-8
    Dictionary Should Contain Item  ${body}  name     Fauna
    Dictionary Should Contain Item  ${body}  name_ru  Фауна
    Dictionary Should Contain Item  ${body}  slug     fauna

DELETE should remove an object
    ${response}=      Delete Request  api  /v1/categories/1
    Status Should Be  204  ${response}
    # checks that it was removed
    ${response}=      Get Request  api  /v1/categories/1
    Status Should Be  404  ${response}
