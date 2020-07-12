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

const createEndpoints = async (destDir, fileName, config) => {
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

    for (let endpoint of config) {
        console.log('GET', endpoint.path, '=>', endpoint.get);
    }

    const resultedCode = await ejs.renderFile(
        __dirname + '/templates/app.js.ejs',
        {
            "endpoints": config
        }
    );

    fs.writeFileSync(resultFile, resultedCode);
};

const createPackageJson = async (destDir, fileName) => {
    console.log('Generate', fileName);

    const resultFile = path.join(destDir, fileName);
    const projectName = path.basename(destDir);
    console.log('Project name:', projectName);

    const minimalPackageJson = await ejs.renderFile(
        __dirname + '/templates/package.json.ejs',
        {
            projectName
        }
    );

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
