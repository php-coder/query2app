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
   - path: /v1/categories/count
     get:  SELECT COUNT(*) AS counter FROM categories

   - path: /v1/categories
     get_list: >-
       SELECT id, name, name_ru, slug
         FROM categories
     post: >-
       INSERT INTO categories(name, slug, created_at, created_by, updated_at, updated_by)
       VALUES (:b.name, :b.slug, NOW(), :b.userId, NOW(), :b.userId)

   - path: /v1/categories/:categoryId
     get: >-
       SELECT id, name, name_ru, slug
         FROM categories
        WHERE id = :p.categoryId
     put: >-
       UPDATE categories
          SET name = :b.name, name_ru = :b.nameRu, slug = :b.slug, updated_at = NOW(), updated_by = :b.userId
        WHERE id = :p.categoryId
     delete: >-
       DELETE
         FROM categories
        WHERE id = :p.categoryId
   ```
   Note that the queries use a little unusual named parameters: `:b.name`, `p.categoryId`, etc The prefixes `b` (body) and `p` (path) are used here in order to bind to parameters from the appropriate sources. The prefixes are needed only during code generation and they will absent from the resulted code.

1. Generate code
   ```console
   $ npx query2app
   ```
   An example of generated code can be inspect at [examples/js](examples/js) directory.

1. Run the application
   ```console
   $ npm install
   $ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password
   $ npm start
   ```
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
   $ curl http://localhost:3000/v1/categories/count
   {"counter":0}
   $ curl -i -H 'Content-Type: application/json' -d '{"name":"Sport","nameRu":"Спорт","slug":"sport","userId":100}' http://localhost:3000/v1/categories
   HTTP/1.1 204 No Content
   ETag: W/"a-bAsFyilMr4Ra1hIU5PyoyFRunpI"
   Date: Wed, 15 Jul 2020 18:06:33 GMT
   Connection: keep-alive
   $ curl http://localhost:3000/v1/categories
   [{"id":1,"name":"Sport","name_ru":"Спорт","slug":"sport"}]
   $ curl -i -H 'Content-Type: application/json' -d '{"name":"Fauna","nameRu":"Фауна","slug":"fauna","userId":101,"categoryId":1}' -X PUT http://localhost:3000/v1/categories/1
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
