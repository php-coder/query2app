import { Express, NextFunction, Request, Response } from 'express'
import { Pool } from 'mysql'

exports.register = (app: Express, pool: Pool) => {

    app.get('/custom/route', (req: Request, res: Response, next: NextFunction) => {
        res.json({ "custom": true })
    })

}
