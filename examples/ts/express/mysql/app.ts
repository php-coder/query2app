import express from 'express'
import { NextFunction, Request, Response } from 'express'
import mysql from 'mysql'

const routes = require('./routes')
const custom_routes = require('./custom_routes')

const app = express()
app.use(express.json())

const pool = mysql.createPool({
    connectionLimit: 2,
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Support of named placeholders (https://github.com/mysqljs/mysql#custom-format)
    queryFormat: function(this: mysql.Pool, query, values) {
        if (!values) {
            return query
        }
        return query.replace(/\:(\w+)/g, function(this: mysql.Pool, matchedSubstring: string, capturedValue: string) {
            if (values.hasOwnProperty(capturedValue)) {
                return this.escape(values[capturedValue])
            }
            return matchedSubstring
        }.bind(this))
    },
    // Support for conversion from TINYINT(1) to boolean (https://github.com/mysqljs/mysql#custom-type-casting)
    typeCast: function(field, next) {
        if (field.type === 'TINY' && field.length === 1) {
            return field.string() === '1'
        }
        return next()
    }
})

routes.register(app, pool)
custom_routes.register(app, pool)

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    console.error(error)
    res.status(500).json({ "error": "Internal Server Error" })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`Listen on ${port}`)
})
