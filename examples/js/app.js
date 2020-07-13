const express = require('express')
const mysql = require('mysql')

const app = express()
app.set('x-powered-by', false)

const pool = mysql.createPool({
    connectionLimit: 2,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})


app.get('/v1/categories/count', (req, res) => {
    pool.query('SELECT COUNT(*) AS counter FROM categories', (err, rows, fields) => {
        if (err) {
            throw err
        }
        const counter = rows[0].counter
        res.json(counter)
    })
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listen on ${port}`)
})
