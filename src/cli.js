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

// "SELECT *\n   FROM foo" => "SELECT * FROM foo"
const flattenQuery = (query) => query.replace(/\n[ ]*/g, ' ');

const createEndpoints = async (destDir, fileName, config) => {
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

    for (let endpoint of config) {
        if (endpoint.hasOwnProperty('get')) {
            console.log('GET', endpoint.path, '=>', flattenQuery(endpoint.get));
        } else if (endpoint.hasOwnProperty('get_list')) {
            console.log('GET', endpoint.path, '=>', flattenQuery(endpoint.get_list));
        }
        if (endpoint.hasOwnProperty('post')) {
            console.log('POST', endpoint.path, '=>', flattenQuery(endpoint.post));
        }
        if (endpoint.hasOwnProperty('put')) {
            console.log('PUT', endpoint.path, '=>', flattenQuery(endpoint.put));
        }
        if (endpoint.hasOwnProperty('delete')) {
            console.log('DELETE', endpoint.path, '=>', flattenQuery(endpoint.delete));
        }
    }

    const resultedCode = await ejs.renderFile(
        __dirname + '/templates/app.js.ejs',
        {
            "endpoints": config,

            // "... WHERE id = :id" => [ ":id" ] => [ "id" ]
            "extractParams": (query) => {
                const params = query.match(/:\w+/g) || [];
                return params.length > 0
                    ? params.map(p => p.substring(1))
                    : params;
            },

            // [ "page", "num" ] => '{ "page" : req.params.page, "num": req.params.num }'
            "formatParams": (params, targetObject) => {
                return params.length > 0
                    ? '{ ' + Array.from(new Set(params), p => `"${p}": ${targetObject}.${p}`).join(', ') + ' }'
                    : params;
            },

            // "SELECT *\n   FROM foo" => "'SELECT * FROM foo'"
            "formatQuery": (query) => {
                return "'" + flattenQuery(query) + "'";
            }
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

console.info(`The application has been generated!
Use
  npm install
to install its dependencies and
  export DB_NAME=db DB_USER=user DB_PASSWORD=secret
  npm start
afteward to run it`);
