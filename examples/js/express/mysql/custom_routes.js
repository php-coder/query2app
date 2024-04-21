exports.register = (app, pool) => {

    app.get('/custom/route', (req, res, next) => {
        res.json({ "custom": true })
    })

    app.get('/custom/exception', (req, res, next) => {
        throw new Error('expected err')
    })

}
