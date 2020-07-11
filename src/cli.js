#!/usr/bin/env node

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const endpointsFile = 'endpoints.yaml';
const resultFile = 'app.js';

const loadConfig = (endpointsFile) => {
    console.log('Read', endpointsFile);
    try {
        const content = fs.readFileSync(endpointsFile, 'utf8');
        const config = yaml.safeLoad(content);
        //console.debug(config);
        return config;
    } catch (ex) {
        console.error(`Failed to parse ${endpointsFile}: ${ex.message}`);
        throw ex;
    }
};

const createEndpoints = (destDir, fileName, config) => {
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

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

const createPackageJson = (destDir, fileName) => {
    console.log('Generate', fileName);

    const resultFile = path.join(destDir, fileName);
    const projectName = path.basename(destDir);
    console.log('Project name:', projectName);

    const minimalPackageJson = `{
      "name": "${projectName}",
      "version": "1.0.0",
      "scripts": {
        "start": "node app.js"
      },
      "dependencies": {
        "express": "~4.17.1"
      }
    }\n`.replace(/^    /gm, '');

    fs.writeFileSync(resultFile, minimalPackageJson);
};

const config = loadConfig(endpointsFile);

const destDir = process.cwd();
createEndpoints(destDir, resultFile, config);

createPackageJson(destDir, 'package.json');

console.info('The application has been generated!\nUse\n  npm install\nto install its dependencies and\n  npm start\nafteward to run it');
