#!/usr/bin/env node

const yaml = require('js-yaml');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const parseArgs = require('minimist');

const { Parser } = require('node-sql-parser');

const endpointsFile = 'endpoints.yaml';

const parseCommandLineArgs = (args) => {
    const opts = {
        'string': [ 'lang' ],
        'default': {
            'lang': 'js'
        }
    };
    const argv = parseArgs(args, opts);
    //console.debug('argv:', argv);
    return argv;
}

// Restructure YAML configuration to simplify downstream code.
//
// Converts
//   {
//     get_list: { query: <sql> },
//     put:      { query: <sql> }
//   }
// into
//   {
//     methods: [
//       { name: get_list, verb: get, query: <sql> },
//       { name: put,      verb: put, query: <sql> }
//     ]
//   }
const restructureConfiguration = (config) => {
    for (const endpoint of config) {
        endpoint.methods = [];
        [ 'get', 'get_list', 'post', 'put', 'delete' ].forEach(method => {
            if (!endpoint.hasOwnProperty(method)) {
                return;
            }
            endpoint.methods.push({
                'name': method,
                'verb': method !== 'get_list' ? method : 'get',
                ...endpoint[method],
            });
            delete endpoint[method];
        });
    }
};

const loadConfig = (endpointsFile) => {
    console.log('Read', endpointsFile);
    try {
        const content = fs.readFileSync(endpointsFile, 'utf8');
        const config = yaml.safeLoad(content);
        restructureConfiguration(config);
        //console.debug(config);
        return config;
    } catch (ex) {
        console.error(`Failed to parse ${endpointsFile}: ${ex.message}`);
        throw ex;
    }
};

const createApp = async (destDir, lang) => {
    const fileName = `app.${lang}`
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

    fs.copyFileSync(`${__dirname}/templates/app.${lang}`, resultFile)
};

// "SELECT *\n   FROM foo" => "SELECT * FROM foo"
const flattenQuery = (query) => query.replace(/\n[ ]*/g, ' ');

// "WHERE id = :p.categoryId OR id = :b.id" => "WHERE id = :categoryId OR id = :id"
const removePlaceholders = (query) => query.replace(/(?<=:)[pb]\./g, '');

// "/categories/:id" => "/categories/{id}"
// (used only with Golang's go-chi)
const convertPathPlaceholders = (path) => path.replace(/:([^\/]+)/g, '{$1}');

const createEndpoints = async (destDir, lang, config) => {
    const fileName = `routes.${lang}`
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

    for (let endpoint of config) {
        let path = endpoint.path;
        if (lang === 'go') {
            path = convertPathPlaceholders(path)
        }
        endpoint.methods.forEach(method => {
            const sql = removePlaceholders(flattenQuery(method.query));
            const verb = method.verb.toUpperCase();

            console.log(`${verb} ${path} => ${sql}`);
        });
    }

    const placeholdersMap = {
        'p': 'req.params',
        'b': 'req.body'
    }

    const parser = new Parser();

    const resultedCode = await ejs.renderFile(
        `${__dirname}/templates/routes.${lang}.ejs`,
        {
            "endpoints": config,

            // "... WHERE id = :p.id" => [ "p.id" ] => [ "p.id" ]
            "extractParams": (query) => query.match(/(?<=:)[pb]\.\w+/g) || [],

            // [ "p.page", "b.num" ] => '{ "page" : req.params.page, "num": req.body.num }'
            // (used only with Express)
            "formatParams": (params) => {
                return params.length > 0
                    ? '{ ' + Array.from(new Set(params), p => `"${p.substring(2)}": ${placeholdersMap[p.substring(0, 1)]}.${p.substring(2)}`).join(', ') + ' }'
                    : params;
            },

            // "SELECT *\n   FROM foo" => "SELECT * FROM foo"
            "formatQuery": (query) => {
                return removePlaceholders(flattenQuery(query));
            },

            // (used only with Golang's go-chi)
            "convertPathPlaceholders": convertPathPlaceholders,

            // (used only with Golang)
            "sqlParser": parser,

            // (used only with Golang)
            "removePlaceholders": removePlaceholders,
        }
    );

    fs.writeFileSync(resultFile, resultedCode);
};

const createDependenciesDescriptor = async (destDir, lang) => {
    let fileName;
    if (lang === 'js') {
        fileName = 'package.json'

    } else if (lang === 'go') {
        fileName = 'go.mod'

    } else {
        return;
    }

    console.log('Generate', fileName);

    const resultFile = path.join(destDir, fileName);
    const projectName = path.basename(destDir);
    console.log('Project name:', projectName);

    const minimalPackageJson = await ejs.renderFile(
        `${__dirname}/templates/${fileName}.ejs`,
        {
            // project name is being used only for package.json
            projectName
        }
    );

    fs.writeFileSync(resultFile, minimalPackageJson);
};

const showInstructions = (lang) => {
    console.info('The application has been generated!')
    if (lang === 'js') {
        console.info(`Use
  npm install
to install its dependencies and
  export DB_NAME=db DB_USER=user DB_PASSWORD=secret
  npm start
afteward to run`);
    } else if (lang === 'go') {
        console.info(`Use
  go run *.go
or
  go build -o app
  ./app
to build and run it`)
    }
};


const argv = parseCommandLineArgs(process.argv.slice(2));

const config = loadConfig(endpointsFile);

let destDir = argv._.length > 0 ? argv._[0] : '.';
destDir = path.resolve(process.cwd(), destDir);
console.log('Destination directory:', destDir)

if (!fs.existsSync(destDir)) {
    console.log('Create', destDir)
    fs.mkdirSync(destDir, {recursive: true});
}

createApp(destDir, argv.lang, config);
createEndpoints(destDir, argv.lang, config);
createDependenciesDescriptor(destDir, argv.lang);
showInstructions(argv.lang);
