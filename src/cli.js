#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');

const endpointsFile = 'endpoints.yaml';
console.log('Read', endpointsFile);

try {

    const content = fs.readFileSync(endpointsFile, 'utf8');
    const config = yaml.safeLoad(content);
    //console.debug(config);
    console.log('Generate code');
    for (let endpoint of config) {
        console.log('GET', endpoint.path, '=>', endpoint.get);
    }

} catch (ex) {
    console.error('Failed to parse', endpointsFile);
}
