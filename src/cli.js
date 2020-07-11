#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');

const endpointsFile = 'endpoints.yaml';
const resultFile = 'app.js';

const createEndpoints = (config) => {
    console.log('Generate', resultFile);
    for (let endpoint of config) {
        console.log('GET', endpoint.path, '=>', endpoint.get);
    }

    const resultedCode = `const express = require('express')
    const app = express()
    app.set('x-powered-by', false)

    app.get('${config[0].path}', (req, res) => {
        console.debug('Execute ${config[0].get}')
        res.sendStatus(200)
    })

    app.listen(3000, () => {
        console.log('Listen on 3000')
    })\n`.replace(/^    /gm, '');

    fs.writeFileSync(resultFile, resultedCode);
};

console.log('Read', endpointsFile);

try {

    const content = fs.readFileSync(endpointsFile, 'utf8');
    const config = yaml.safeLoad(content);
    //console.debug(config);
    createEndpoints(config);

} catch (ex) {
    console.error('Failed to parse', endpointsFile);
}
