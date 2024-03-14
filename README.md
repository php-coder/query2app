# Query To App
Generates the endpoints (or a whole app) from a mapping (SQL query -> URL)

>:warning: This is a proof of concept at this moment. Until it reaches a stable version, it might (and will) break a compatibility.

# How to use

1. Navigate to a project catalog
   ```console
   $ mkdir new-project
   $ cd new-project
   ```

1. Create a mapping file `endpoints.yaml`
   ```console
   $ vim endpoints.yaml
   - path: /v1/categories
     get_list:
       query: >-
         SELECT id, name, name_ru, slug
           FROM categories
          LIMIT :q.limit
     post:
       query: >-
         INSERT INTO categories(name, slug, created_at, created_by, updated_at, updated_by)
         VALUES (:b.name, :b.slug, NOW(), :b.user_id, NOW(), :b.user_id)

   - path: /v1/categories/:categoryId
     get:
       query: >-
         SELECT id, name, name_ru, slug
           FROM categories
          WHERE id = :p.categoryId
     put:
       query: >-
         UPDATE categories
            SET name = :b.name, name_ru = :b.name_ru, slug = :b.slug, updated_at = NOW(), updated_by = :b.user_id
          WHERE id = :p.categoryId
     delete:
       query: >-
         DELETE
           FROM categories
          WHERE id = :p.categoryId
   ```
   Note that the queries use a little unusual named parameters: `:b.name`, `:p.categoryId`, etc The prefixes `q` (query), `b` (body) and `p` (path) are used here in order to bind to parameters from the appropriate sources. The prefixes are needed only during code generation and they will absent from the resulted code.

1. Generate code   
   | Language   | Command for code generation | Example of generated files | Libraries |
   | -----------| ----------------------------| ---------------------------| --------- |
   | JavaScript | `npx query2app --lang js`   | [`app.js`](examples/js/express/mysql/app.js)<br/>[`routes.js`](examples/js/express/mysql/routes.js)<br/>[`package.json`](examples/js/express/mysql/package.json) | Web: [`express`](https://www.npmjs.com/package/express)<br>Database: [`mysql`](https://www.npmjs.com/package/mysql) |
   | TypeScript | `npx query2app --lang ts`   | [`app.ts`](examples/ts/express/mysql/app.ts)<br/>[`routes.ts`](examples/ts/express/mysql/routes.ts)<br/>[`package.json`](examples/ts/express/mysql/package.json)<br/>[`tsconfig.json`](examples/ts/express/mysql/tsconfig.json) | Web: [`express`](https://www.npmjs.com/package/express)<br>Database: [`mysql`](https://www.npmjs.com/package/mysql) |
   | Golang     | `npx query2app --lang go`   | [`app.go`](examples/go/chi/mysql/app.go)<br/>[`routes.go`](examples/go/chi/mysql/routes.go)<br/>[`go.mod`](examples/go/chi/mysql/go.mod) | Web: [`go-chi/chi`](https://github.com/go-chi/chi)<br/>Database: [`go-sql-driver/mysql`](https://github.com/go-sql-driver/mysql), [`jmoiron/sqlx`](https://github.com/jmoiron/sqlx) |
   | Python     | `npx query2app --lang python` | [`app.py`](examples/python/fastapi/postgres/app.py)<br/>[`db.py`](examples/python/fastapi/postgres/db.py)<br/>[`routes.py`](examples/python/fastapi/postgres/routes.py)<br/>[`requirements.txt`](examples/python/fastapi/postgres/requirements.txt) | Web: [FastAPI](https://github.com/tiangolo/fastapi), [Uvicorn](https://www.uvicorn.org)<br/>Database: [psycopg2](https://pypi.org/project/psycopg2/) |

1. Run the application
   | Language   | Commands to run the application |
   | -----------| --------------------------------|
   | JavaScript | <pre>$ npm install<br/>$ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password<br/>$ npm start</pre> |
   | TypeScript | <pre>$ npm install<br/>$ npm run build<br/>$ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password<br/>$ npm start</pre> |
   | Golang     | <pre>$ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password<br/>$ go run *.go</pre>or<pre>$ go build -o app<br/>$ ./app</pre> |
   | Python     | <pre>$ pip install -r requirements.txt<br/>$ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password<br/>$ uvicorn app:app</pre> |
   
   ---
   :bulb: **NOTE**
   
   While the example used `export` for setting up the environment variables, we don't recommend export variables that way! This was provided as an example to illustrate that an application follows [The Twelve Factors](https://12factor.net/config) and can be configured by passing environment variables. In real life, you will use docker, docker-compose, Kubernetes or other ways to run an app with required environment variables.
   
   ---
   :bulb: **NOTE**
   
   An app also supports other environment variables:
   
   * `PORT`: a port to listen (defaults to `3000`)
   * `DB_HOST` a database host (defaults to `localhost`)
   
   ---

1. Test that it works
   ```console
   $ curl -i --json '{"name":"Sport","name_ru":"Спорт","slug":"sport","user_id":100}' http://localhost:3000/v1/categories
   HTTP/1.1 204 No Content
   ETag: W/"a-bAsFyilMr4Ra1hIU5PyoyFRunpI"
   Date: Wed, 15 Jul 2020 18:06:33 GMT
   Connection: keep-alive

   $ curl http://localhost:3000/v1/categories
   [{"id":1,"name":"Sport","name_ru":"Спорт","slug":"sport"}]

   $ curl -i --json '{"name":"Fauna","name_ru":"Фауна","slug":"fauna","user_id":101}' -X PUT http://localhost:3000/v1/categories/1
   HTTP/1.1 204 No Content
   ETag: W/"a-bAsFyilMr4Ra1hIU5PyoyFRunpI"
   Date: Wed, 15 Jul 2020 18:06:34 GMT
   Connection: keep-alive

   $ curl http://localhost:3000/v1/categories/1
   {"id":1,"name":"Fauna","name_ru":"Фауна","slug":"fauna"}

   $ curl -i -X DELETE http://localhost:3000/v1/categories/1
   HTTP/1.1 204 No Content
   ETag: W/"a-bAsFyilMr4Ra1hIU5PyoyFRunpI"
   Date: Wed, 15 Jul 2020 18:06:35 GMT
   Connection: keep-alive
   ```
