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

const lang2extension = (lang) => {
    switch (lang) {
        case 'js':
        case 'go':
            return lang
        case 'python':
            return 'py'
        default:
            throw new Error(`Unsupported language: ${lang}`)
    }
}

const createApp = async (destDir, lang) => {
    const ext = lang2extension(lang)
    const fileName = `app.${ext}`
    console.log('Generate', fileName);
    const resultFile = path.join(destDir, fileName);

    fs.copyFileSync(`${__dirname}/templates/app.${ext}`, resultFile)
};

// "SELECT *\n   FROM foo" => "SELECT * FROM foo"
const flattenQuery = (query) => query.replace(/\n[ ]*/g, ' ');

// "WHERE id = :p.categoryId OR id = :b.id" => "WHERE id = :categoryId OR id = :id"
const removePlaceholders = (query) => query.replace(/(?<=:)[pb]\./g, '');

// "/categories/:id" => "/categories/{id}"
// (used only with Golang's go-chi)
const convertPathPlaceholders = (path) => path.replace(/:([^\/]+)/g, '{$1}');

// "name_ru" => "nameRu"
// (used only with Golang's go-chi)
const snake2camelCase = (str) => str.replace(/_([a-z])/g, (match, group) => group.toUpperCase());

// "categoryId" => "category_id"
// (used only with Python's FastAPI)
const camel2snakeCase = (str) => str.replace(/([A-Z])/g, (match, group) => '_' + group.toLowerCase());

// "nameRu" => "NameRu"
// (used only with Golang's go-chi)
const capitalize = (str) => str[0].toUpperCase() + str.slice(1);

// ["a", "bb", "ccc"] => 3
// (used only with Golang's go-chi)
const lengthOfLongestString = (arr) => arr
		.map(el => el.length)
		.reduce(
			(acc, val) => val > acc ? val : acc,
			0 /* initial value */
		);

const createEndpoints = async (destDir, lang, config) => {
    const ext = lang2extension(lang)
    const fileName = `routes.${ext}`
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

            console.log(`${verb} ${path}\n\t${sql}`);
        });
    }

    const placeholdersMap = {
        'js': {
            'p': 'req.params',
            'b': 'req.body',
        },
        'go': {
            'p': function(param) {
                return `chi.URLParam(r, "${param}")`
            },
            'b': function(param) {
                return 'dto.' + capitalize(snake2camelCase(param));
            },
        }
    }

    const parser = new Parser();

    const resultedCode = await ejs.renderFile(
        `${__dirname}/templates/routes.${ext}.ejs`,
        {
            "endpoints": config,

            // "... WHERE id = :p.id" => [ "p.id" ]
            "extractParamsFromQuery": (query) => query.match(/(?<=:)[pb]\.\w+/g) || [],

            // "/categories/:categoryId" => [ "categoryId" ]
            // (used only with FastAPI)
            "extractParamsFromPath": (query) => query.match(/(?<=:)\w+/g) || [],
            
            // [ "p.page", "b.num" ] => '"page": req.params.page, "num": req.body.num'
            // (used only with Express)
            "formatParamsAsJavaScriptObject": (params) => {
                if (params.length === 0) {
                    return params;
                }
                return Array.from(
                        new Set(params),
                        p => {
                            const bindTarget = p.substring(0, 1);
                            const paramName = p.substring(2);
                            const prefix = placeholdersMap['js'][bindTarget];
                            return `"${paramName}": ${prefix}.${paramName}`
                        }
                    ).join(', ');
            },

            // "SELECT *\n   FROM foo WHERE id = :p.id" => "SELECT * FROM foo WHERE id = :id"
            "formatQuery": (query) => {
                return removePlaceholders(flattenQuery(query));
            },

            // (used only with Golang)
            "convertPathPlaceholders": convertPathPlaceholders,
            "sqlParser": parser,
            "removePlaceholders": removePlaceholders,
            "snake2camelCase": snake2camelCase,
            "capitalize": capitalize,
            "lengthOfLongestString": lengthOfLongestString,

            // used only with Pyth
            "camel2snakeCase": camel2snakeCase,

            // [ "p.page", "b.num" ] => '"page": chi.URLParam(r, "page"),\n\t\t\t"num": dto.Num),'
            // (used only with Golang's go-chi)
            "formatParamsAsGolangMap": (params) => {
                if (params.length === 0) {
                    return params;
                }
                const maxParamNameLength = lengthOfLongestString(params);
                return Array.from(
                        new Set(params),
                        p => {
                            const bindTarget = p.substring(0, 1);
                            const paramName = p.substring(2);
                            const formatFunc = placeholdersMap['go'][bindTarget];
                            const quotedParam = '"' + paramName + '":';
                            // We don't count quotes and colon because they are compensated by "p." prefix.
                            // We do +1 because the longest parameter will also have an extra space as a delimiter.
                            return `${quotedParam.padEnd(maxParamNameLength+1)} ${formatFunc(paramName)},`
                        }
                    ).join('\n\t\t\t');
            },
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

    } else if (lang === 'python') {
        fileName = 'requirements.txt'

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
    } else if (lang === 'python') {
        console.info(`Use
  pip install -r requirements.txt
to install its dependencies and
  uvicorn app:app
afteward to run`)
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
