const express = require('express')
const mysql = require('mysql')

const app = express()
app.set('x-powered-by', false)

const pool = mysql.createPool({
    connectionLimit: 2,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Support of named placeholders (https://github.com/mysqljs/mysql#custom-format)
    queryFormat: function(query, values) {
        if (!values) {
            return query;
        }
        return query.replace(/\:(\w+)/g, function(txt, key) {
            if (values.hasOwnProperty(key)) {
                return this.escape(values[key]);
            }
            return txt;
        }.bind(this));
    }
})


app.get('/v1/categories/count', (req, res) => {
    pool.query(
        'SELECT COUNT(*) AS counter FROM categories',
        (err, rows, fields) => {
            if (err) {
                throw err
            }
            const counter = rows[0].counter
            res.json(counter)
        }
    )
})

app.get('/v1/collections/:collectionId/categories/count', (req, res) => {
    pool.query(
        'SELECT COUNT(DISTINCT s.category_id) AS counter FROM collections_series cs JOIN series s ON s.id = cs.series_id WHERE cs.collection_id = :collectionId',
        { "collectionId": req.params.collectionId },
        (err, rows, fields) => {
            if (err) {
                throw err
            }
            const counter = rows[0].counter
            res.json(counter)
        }
    )
})

app.post('/v1/categories', (req, res) => {
    res.sendStatus(200)
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listen on ${port}`)
})
