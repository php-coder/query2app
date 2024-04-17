exports.register = (app, pool) => {

    app.get('/custom/route', (req, res, next) => {
        res.json({ "custom": true })
    })

}
