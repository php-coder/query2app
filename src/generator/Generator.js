const JsGenerator = require('./JsGenerator')
const TsGenerator = require('./TsGenerator')
const GoGenerator = require('./GoGenerator')
const PyGenerator = require('./PyGenerator')

module.exports = class Generator {

    static for(lang) {
        switch (lang) {
            case 'js':
                return new JsGenerator()
            case 'ts':
                return new TsGenerator()
            case 'go':
                return new GoGenerator()
            case 'py':
                return new PyGenerator()
            default:
                throw new Error(`Unsupported language: ${lang}`)
        }
    }

}
