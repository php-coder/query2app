import { Express, NextFunction, Request, Response } from 'express'
import { Pool } from 'mysql'

const register = (app: Express, pool: Pool) => {

    app.get('/v1/categories/count', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'SELECT COUNT(*) AS counter FROM categories',
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                if (rows.length === 0) {
                    res.status(404).end()
                    return
                }
                res.json(rows[0])
            }
        )
    })

    app.get('/v1/collections/:collectionId/categories/count', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'SELECT COUNT(DISTINCT s.category_id) AS counter FROM collections_series cs JOIN series s ON s.id = cs.series_id WHERE cs.collection_id = :collectionId',
            { "collectionId": req.params.collectionId },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                if (rows.length === 0) {
                    res.status(404).end()
                    return
                }
                res.json(rows[0])
            }
        )
    })

    app.get('/v1/categories', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'SELECT id , name , name_ru , slug FROM categories LIMIT :limit',
            { "limit": req.query.limit },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                res.json(rows)
            }
        )
    })

    app.post('/v1/categories', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'INSERT INTO categories ( name , name_ru , slug , created_at , created_by , updated_at , updated_by ) VALUES ( :name , :name_ru , :slug , NOW() , :user_id , NOW() , :user_id )',
            { "name": req.body.name, "name_ru": req.body.name_ru, "slug": req.body.slug, "user_id": req.body.user_id },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                res.sendStatus(204)
            }
        )
    })

    app.get('/v1/categories/:categoryId', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'SELECT id , name , name_ru , slug FROM categories WHERE id = :categoryId',
            { "categoryId": req.params.categoryId },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                if (rows.length === 0) {
                    res.status(404).end()
                    return
                }
                res.json(rows[0])
            }
        )
    })

    app.put('/v1/categories/:categoryId', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'UPDATE categories SET name = :name , name_ru = :name_ru , slug = :slug , updated_at = NOW() , updated_by = :user_id WHERE id = :categoryId',
            { "name": req.body.name, "name_ru": req.body.name_ru, "slug": req.body.slug, "user_id": req.body.user_id, "categoryId": req.params.categoryId },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                res.sendStatus(204)
            }
        )
    })

    app.delete('/v1/categories/:categoryId', (req: Request, res: Response, next: NextFunction) => {
        pool.query(
            'DELETE FROM categories WHERE id = :categoryId',
            { "categoryId": req.params.categoryId },
            (err, rows, fields) => {
                if (err) {
                    return next(err)
                }
                res.sendStatus(204)
            }
        )
    })

    app.use((error: any, req: Request, res: Response, next: NextFunction) => {
        console.error(error)
        res.status(500).json({ "error": "Internal Server Error" })
    })
}

exports.register = register;
