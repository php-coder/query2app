const express = require('express')
const mysql = require('mysql')
const routes = require('./routes')

const app = express()
app.use(express.json())

const pool = mysql.createPool({
    connectionLimit: 2,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Support of named placeholders (https://github.com/mysqljs/mysql#custom-format)
    queryFormat: function(query, values) {
        if (!values) {
            return query
        }
        return query.replace(/\:(\w+)/g, function(txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key])
            }
            return txt
        }.bind(this))
    }
})

routes.register(app, pool)

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Listen on ${port}`)
})
