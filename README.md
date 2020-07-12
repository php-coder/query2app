# Query To App
Generates the endpoints (or a whole app) from a mapping (SQL query -> URL)

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
   ```
1. Generate code
   ```console
   $ npx query2app
   Read endpoints.yaml
   Destination directory: /Users/coder/new-project
   Generate app.js
   GET /v1/categories/count => SELECT COUNT(*) AS counter FROM categories
   Generate package.json
   Project name: new-project
   The application has been generated!
   Use
     npm install
   to install its dependencies and
     export DB_NAME=db DB_USER=user DB_PASSWORD=secret
     npm start
   afteward to run it
   ```
1. Run the application
   ```console
   $ npm install
   $ export DB_NAME=my-db DB_USER=my-user DB_PASSWORD=my-password
   $ npm start
   
   > new-project@1.0.0 start /Users/coder/new-project
   > node app.js
   
   Listen on 3000
   ```
1. Test that it works
   ```console
   $ curl -i http://localhost:3000/v1/categories/count
   HTTP/1.1 200 OK
   Content-Type: application/json; charset=utf-8
   Content-Length: 1
   ETag: W/"1-d95o2uzYI7q7tY7bHI4U1xBug7s"
   Date: Sun, 12 Jul 2020 17:01:25 GMT
   Connection: keep-alive

   3
   ```
