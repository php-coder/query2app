#!/usr/bin/env node

const yaml = require('js-yaml')
const ejs = require('ejs')
const fs = require('fs')
const fsPromises = require('fs/promises')
const path = require('path')

const parseArgs = require('minimist')

const { Parser } = require('node-sql-parser')

const Generator = require('./generator/Generator')

const endpointsFile = 'endpoints.yaml'

const parseCommandLineArgs = (args) => {
    const opts = {
        // @todo #24 Document --dest-dir option
        'string': [ 'lang', 'dest-dir' ],
        'default': {
            'lang': 'js',
            'dest-dir': '.'
        }
    }
    const argv = parseArgs(args, opts)
    //console.debug('argv:', argv)
    return argv
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
        endpoint.methods = []; // this semicolon is really needed
        [ 'get', 'get_list', 'post', 'put', 'delete' ].forEach(method => {
            if (!endpoint.hasOwnProperty(method)) {
                return
            }
            endpoint.methods.push({
                'name': method,
                'verb': method !== 'get_list' ? method : 'get',
                ...endpoint[method],
            })
            delete endpoint[method]
        })
    }
}

const loadConfig = (endpointsFile) => {
    console.log('Read', endpointsFile)
    try {
        const content = fs.readFileSync(endpointsFile, 'utf8')
        const config = yaml.safeLoad(content)
        restructureConfiguration(config)
        //console.debug(config)
        return config
    } catch (ex) {
        console.error(`Failed to parse ${endpointsFile}: ${ex.message}`)
        throw ex
    }
}

const lang2extension = (lang) => {
    switch (lang) {
        case 'js':
        case 'ts':
        case 'go':
            return lang
        case 'python':
            return 'py'
        default:
            throw new Error(`Unsupported language: ${lang}`)
    }
}

const findFileNamesEndWith = (dir, postfix) => {
    return fs.readdirSync(dir).filter(name => name.endsWith(postfix))
}

const createApp = async (destDir, { lang }) => {
    const ext = lang2extension(lang)
    const fileName = `app.${ext}`
    console.log('Generate', fileName)
    const resultFile = path.join(destDir, fileName)
    const customRouters = findFileNamesEndWith(destDir, `_routes.${ext}`)
    if (customRouters.length > 0) {
        customRouters.forEach(filename => console.log(`Include a custom router from ${filename}`))
    }

    const resultedCode = await ejs.renderFile(
        `${__dirname}/templates/${fileName}.ejs`,
        {
            // @todo #27 Document usage of user defined routes
            // @todo #27 Add integration test to ensure that custom router is picked up
            'customRouteFilenames': customRouters
        }
    )

    return fsPromises.writeFile(resultFile, resultedCode)
}

const createDb = async (destDir, { lang }) => {
    if (lang !== 'python') {
        return
    }
    const fileName = 'db.py'
    console.log('Generate', fileName)
    const resultFile = path.join(destDir, fileName)

    return fsPromises.copyFile(`${__dirname}/templates/${fileName}`, resultFile)
}

// "-- comment\nSELECT * FROM foo" => "SELECT * FROM foo"
const removeComments = (query) => query.replace(/--.*\n/g, '')

// "SELECT *\n   FROM foo" => "SELECT * FROM foo"
const flattenQuery = (query) => query.replace(/\n[ ]*/g, ' ')

// "WHERE id = :p.categoryId OR id = :b.id LIMIT :q.limit" => "WHERE id = :categoryId OR id = :id LIMIT :limit"
const removePlaceholders = (query) => query.replace(/(?<=:)[pbq]\./g, '')

// "/categories/:id" => "/categories/{id}"
// (used only with Golang's go-chi)
const convertPathPlaceholders = (path) => path.replace(/:([^\/]+)/g, '{$1}')

// "name_ru" => "nameRu"
// (used only with Golang's go-chi)
const snake2camelCase = (str) => str.replace(/_([a-z])/g, (match, group) => group.toUpperCase())

// "categoryId" => "category_id"
// (used only with Python's FastAPI)
const camel2snakeCase = (str) => str.replace(/([A-Z])/g, (match, group) => '_' + group.toLowerCase())

// "nameRu" => "NameRu"
// (used only with Golang's go-chi)
const capitalize = (str) => str[0].toUpperCase() + str.slice(1)

// ["a", "bb", "ccc"] => 3
// (used only with Golang's go-chi)
const lengthOfLongestString = (arr) => arr
		.map(el => el.length)
		.reduce(
			(acc, val) => val > acc ? val : acc,
			0 /* initial value */
		)

const createEndpoints = async (destDir, { lang }, config) => {
    const ext = lang2extension(lang)
    const fileName = `routes.${ext}`
    console.log('Generate', fileName)
    const resultFile = path.join(destDir, fileName)

    for (let endpoint of config) {
        let path = endpoint.path
        if (lang === 'go') {
            path = convertPathPlaceholders(path)
        }
        endpoint.methods.forEach(method => {
            const verb = method.verb.toUpperCase()
            console.log(`\t${verb} ${path}`)

            let queries = []
            if (method.query) {
                queries.push(method.query)
            } else if (method.aggregated_queries) {
                queries = Object.values(method.aggregated_queries)
            }
        })
    }

    const placeholdersMap = {
        'js': {
            'p': 'req.params',
            'b': 'req.body',
            'q': 'req.query',
        },
        'go': {
            'p': function(param) {
                return `chi.URLParam(r, "${param}")`
            },
            'b': function(param) {
                return 'body.' + capitalize(snake2camelCase(param))
            },
            'q': function(param) {
                return `r.URL.Query().Get("${param}")`
            },
        },
        'py': {
            'p': '',
            'b': 'body.',
            'q': '',
        },
    }

    const parser = new Parser()

    const resultedCode = await ejs.renderFile(
        `${__dirname}/templates/routes.${ext}.ejs`,
        {
            "endpoints": config,

            // "... WHERE id = :p.id" => [ "p.id" ]
            "extractParamsFromQuery": (query) => query.match(/(?<=:)[pbq]\.\w+/g) || [],

            // "p.id" => "id" + the same for "q" and "b"
            // (used only with FastAPI)
            "stipOurPrefixes": (str) => str.replace(/^[pbq]\./, ''),

            // "/categories/:categoryId" => [ "categoryId" ]
            // (used only with FastAPI)
            "extractParamsFromPath": (query) => query.match(/(?<=:)\w+/g) || [],
            
            // [ "p.page", "b.num" ] => '"page": req.params.page, "num": req.body.num'
            // (used only with Express)
            "formatParamsAsJavaScriptObject": (params) => {
                if (params.length === 0) {
                    return params
                }
                return Array.from(
                        new Set(params),
                        p => {
                            const bindTarget = p.substring(0, 1)
                            const paramName = p.substring(2)
                            const prefix = placeholdersMap['js'][bindTarget]
                            return `"${paramName}": ${prefix}.${paramName}`
                        }
                    ).join(', ')
            },

            // "SELECT *\n   FROM foo WHERE id = :p.id" => "SELECT * FROM foo WHERE id = :id"
            "formatQuery": (query) => {
                return removePlaceholders(flattenQuery(removeComments(query)))
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
                    return params
                }
                const maxParamNameLength = lengthOfLongestString(params)
                return Array.from(
                        new Set(params),
                        p => {
                            const bindTarget = p.substring(0, 1)
                            const paramName = p.substring(2)
                            const formatFunc = placeholdersMap['go'][bindTarget]
                            const quotedParam = '"' + paramName + '":'
                            // We don't count quotes and colon because they are compensated by "p." prefix.
                            // We do +1 because the longest parameter will also have an extra space as a delimiter.
                            return `${quotedParam.padEnd(maxParamNameLength+1)} ${formatFunc(paramName)},`
                        }
                    ).join('\n\t\t\t')
            },

            // [ "p.categoryId" ] => ', {"categoryId": body.categoryId}'
            // (used only with Python)
            "formatParamsAsPythonDict": (params) => {
                if (params.length === 0) {
                    return params
                }
                const indentLevel = 24
                const indent = ' '.repeat(indentLevel)
                const closingIndent = ' '.repeat(indentLevel - 4)
                return ', {\n' + Array.from(
                        new Set(params),
                        p => {
                            const bindTarget = p.substring(0, 1)
                            const paramName = p.substring(2)
                            const prefix = placeholdersMap['py'][bindTarget]
                            return `${indent}"${paramName}": ${prefix}${paramName}`
                        }
                    ).join(',\n') + `\n${closingIndent}}`
            },

            "placeholdersMap": placeholdersMap,
            "removeComments": removeComments,
        }
    )

    return fsPromises.writeFile(resultFile, resultedCode)
}

const createDependenciesDescriptor = async (destDir, { lang }) => {
    let fileName
    if (lang === 'js' || lang === 'ts') {
        fileName = 'package.json'

    } else if (lang === 'go') {
        fileName = 'go.mod'

    } else if (lang === 'python') {
        fileName = 'requirements.txt'

    } else {
        return
    }

    console.log('Generate', fileName)

    const resultFile = path.join(destDir, fileName)
    // @todo #24 [js] Possibly incorrect project name with --dest-dir option
    const projectName = path.basename(destDir)
    if (lang === 'js' || lang === 'ts') {
        console.log('Project name:', projectName)
    }

    const minimalPackageJson = await ejs.renderFile(
        `${__dirname}/templates/${fileName}.ejs`,
        {
            lang,
            // project name is being used only for package.json
            // @todo #35 [js] Let a user to specify project name
            projectName
        }
    )

    return fsPromises.writeFile(resultFile, minimalPackageJson)
}

const createDockerfile = async (destDir, lang) => {
    const fileName = 'Dockerfile'
    console.log('Generate', fileName)

    const resultFile = path.join(destDir, fileName)

    return fsPromises.copyFile(`${__dirname}/templates/${fileName}.${lang}`, resultFile)
}

const createTypeScriptConfig = async (destDir, lang) => {
    if (lang !== 'ts') {
        return
    }
    const fileName = 'tsconfig.json'
    console.log('Generate', fileName)

    const resultFile = path.join(destDir, fileName)

    const tsConfigJson = await ejs.renderFile(
        `${__dirname}/templates/${fileName}.ejs`
    )

    return fsPromises.writeFile(resultFile, tsConfigJson)
}

const absolutePathToDestDir = (argv) => {
    const relativeDestDir = argv._.length > 0 ? argv._[0] : argv['dest-dir']
    return path.resolve(process.cwd(), relativeDestDir)
}

const main = async (argv) => {
    const config = loadConfig(endpointsFile)

    const destDir = absolutePathToDestDir(argv)
    console.log('Destination directory:', destDir)

    if (!fs.existsSync(destDir)) {
        console.log('Create', destDir)
        fs.mkdirSync(destDir, {recursive: true})
    }

    const lang = lang2extension(argv.lang)
    const generator = Generator.for(lang)

    await createApp(destDir, argv)
    await createDb(destDir, argv)
    await createEndpoints(destDir, argv, config)
    await createDependenciesDescriptor(destDir, argv)
    await createTypeScriptConfig(destDir, argv.lang)
    await createDockerfile(destDir, lang)

    console.info('The application has been generated!')
    console.info(generator.usageExampleAsText())
}


const argv = parseCommandLineArgs(process.argv.slice(2))
main(argv)
