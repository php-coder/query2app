#!/usr/bin/env node

const yaml = require('js-yaml');
const ejs = require('ejs');
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

    const template = `const express = require('express')
    const mysql = require('mysql')

    const app = express()
    app.set('x-powered-by', false)

    const pool = mysql.createPool({
        connectionLimit: 2,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    })

    <% endpoints.forEach(function(endpoint) { %>
    app.get('<%- endpoint.path %>', (req, res) => {
        pool.query('<%= endpoint.get %>', (err, rows, fields) => {
            if (err) {
                throw err
            }
            const counter = rows[0].counter
            res.json(counter)
        })
    })
    <% }); %>

    app.listen(3000, () => {
        console.log('Listen on 3000')
    })\n`.replace(/^    /gm, '');

    const resultedCode = ejs.render(template, {
        "endpoints": config
    });

    fs.writeFileSync(resultFile, resultedCode);
};

const createPackageJson = (destDir, fileName) => {
    console.log('Generate', fileName);

    const resultFile = path.join(destDir, fileName);
    const projectName = path.basename(destDir);
    console.log('Project name:', projectName);

    const template = `{
      "name": "<%- projectName %>",
      "version": "1.0.0",
      "scripts": {
        "start": "node app.js"
      },
      "dependencies": {
        "express": "~4.17.1",
        "mysql": "~2.18.1"
      }
    }\n`.replace(/^    /gm, '');

    const minimalPackageJson = ejs.render(template, {
        projectName
    });

    fs.writeFileSync(resultFile, minimalPackageJson);
};

const config = loadConfig(endpointsFile);

let [,, destDir = '.'] = process.argv;
destDir = path.resolve(process.cwd(), destDir);
console.log('Destination directory:', destDir)

if (!fs.existsSync(destDir)) {
    console.log('Create', destDir)
    fs.mkdirSync(destDir, {recursive: true});
}

createEndpoints(destDir, resultFile, config);

createPackageJson(destDir, 'package.json');

console.info('The application has been generated!\nUse\n  npm install\nto install its dependencies and\n  npm start\nafteward to run it');
