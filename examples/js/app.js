const bodyParser = require('body-parser')
const express = require('express')
const mysql = require('mysql')

const app = express()
app.set('x-powered-by', false)
app.use(bodyParser.json())

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
            res.json(rows[0])
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
            res.json(rows[0])
        }
    )
})

app.post('/v1/categories', (req, res) => {
    pool.query(
        'INSERT INTO categories ( name , name_ru , slug , created_at , created_by , updated_at , updated_by ) VALUES ( :name , :nameRu , :slug , NOW() , :userId , NOW() , :userId )',
        { "name": req.body.name, "nameRu": req.body.nameRu, "slug": req.body.slug, "userId": req.body.userId },
        (err, rows, fields) => {
            if (err) {
                throw err
            }
            res.sendStatus(204)
        }
    )
})

app.put('/v1/categories/:categoryId', (req, res) => {
    pool.query(
        'UPDATE categories SET name = :name , name_ru = :nameRu , slug = :slug , updated_at = NOW() , updated_by = :userId WHERE id = :categoryId',
        { "name": req.body.name, "nameRu": req.body.nameRu, "slug": req.body.slug, "userId": req.body.userId, "categoryId": req.body.categoryId },
        (err, rows, fields) => {
            if (err) {
                throw err
            }
            res.sendStatus(204)
        }
    )
})

app.delete('/v1/categories/:categoryId', (req, res) => {
    pool.query(
        'DELETE FROM categories WHERE id = :categoryId',
        { "categoryId": req.params.categoryId },
        (err, rows, fields) => {
            if (err) {
                throw err
            }
            res.sendStatus(204)
        }
    )
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listen on ${port}`)
})
