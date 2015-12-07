var https = require('https');
var url = require('url');
var fs = require('fs');
var AWS = require('aws-sdk');

var pathstart = '';

// Define the folder of your project that has been created with jaws project create
var projectPath = pathstart + '/helloworld';

// define the folder of your module created by 'jaws module create'
// (works currently with only one single module - feel free to change this behaviour, if required)
var moduleName = 'greetings';

// Set Environmental variables, if required in lambda functions
process.env.JAWS_STAGE = 'dev';

var LocalContext = require('./LocalContext.js');

/**
 * please use your https-certificates or create selfsigned certificates
 */
var serverOptions = {
    key: fs.readFileSync(projectPath + '/cert/server.key').toString('utf-8'),
    cert: fs.readFileSync(projectPath + '/cert/server.crt').toString('utf-8')
};

var parseAwsmFiles = function () {
    console.log('parsing awsmfiles');
    var projectsFolder = projectPath + '/aws_modules/';

    var folderNames = fs.readdirSync(projectsFolder);
    var result = {
        'methodMap': [],
        'contentType': []
    };
    for (var i in folderNames) {
        var folder = folderNames[i];
        if (folder.indexOf('.') == -1) {
            var lambdafolder = projectsFolder + folder + '/';
            var subFolderNames = fs.readdirSync(lambdafolder);
            for (var j in subFolderNames) {
                var subfolder = subFolderNames[j];
                if (subfolder.indexOf('.') == -1) {
                    var awsmFile = lambdafolder + subfolder + '/awsm.json';
                    var awsm = require(awsmFile);

                    result['methodMap'][awsm.apiGateway.cloudFormation.Path] = subfolder;
                    for (var k in awsm.apiGateway.cloudFormation.Responses.default.responseTemplates) {
                        result['contentType'][awsm.apiGateway.cloudFormation.Path] = k;
                    }
                }
            }
        }
    }

    return result;
};

var awsm = parseAwsmFiles();
var methodMap = awsm['methodMap'];
var contentTypes = awsm['contentType'];

/**
 * handles a request on the host and forwards it to the jaws framework
 */
var handler = function(req, res) {
    var eventConverter = {

        /**
         * request object of https.server
         *
         * @var {object}
         */
        'req': {},

        /**
         * response object of https.server
         *
         * @var {object}
         */
        'res': {},

        /**
         * event object
         *
         * @var {object}
         */
        'event': {},

        /**
         * context object
         *
         * @var {object}
         */
        'context': {},

        /**
         * mapping between lambda and pathes
         *
         * @var {object}
         */
        'methodMap': methodMap,

        /**
         * contenttypes of a request
         *
         * @var {object}
         */
        'contentTypes': contentTypes,

        /**
         * Name of Module
         *
         * @var {String}
         */
        'moduleName': moduleName,

        /**
         * initializing
         *
         * @param {Object} req
         * @param {Object} res
         *
         * @return {void}
         */
        'init': function (req, res) {
            this.req = req;
            this.res = res;

            if (!this._isValidMethod(this._getMethod())){
                return this._returnErrorMessage('method not found');
            }

            this._initContext();
            this._setUrlParams();
            this._setHeaderParams();

            this._setPayload(function() {
                this._runApp.bind(this)();
            }.bind(this));
        },

        /**
         * initialize context
         *
         * @return {void}
         */
        '_initContext': function () {
            var method = this._getMethod();

            this.context = new LocalContext(this.res, this.contentTypes[method]);
        },

        /**
         * set url params to event
         *
         * @return {void}
         */
        '_setUrlParams': function () {
            // parameters
            var url_parts = url.parse(this.req.url, true);
            var query = url_parts.query;
            for (var i in query) {
                this.event[i] = query[i];
            }
        },

        /**
         * returns requested method
         *
         * @return {string}
         */
        '_getMethod': function () {
            // parameters
            var url_parts = url.parse(this.req.url, true);

            var parts = url_parts.pathname.split('/');
            return parts[(parts.length - 1)];
        },

        /**
         * set header params to event
         *
         * @return {void}
         */
        '_setHeaderParams': function () {
            for (var i in this.req.headers) {
                this.event[i] = this.req.headers[i];
            }
        },

        /**
         * set payload to event and call callback
         *
         * @param {function} callback
         *
         * @return {void}
         */
        '_setPayload': function (callback) {
            var body = '';
            req.on('data', function (chunk) {
                body += chunk;
            });
            req.on('end', function () {
                this.event['payload'] = body;
                callback();
            }.bind(this));
        },

        /**
         * returns methodmap
         *
         * @return {Object}
         */
        '_getMethodMap': function () {
            return this.methodMap;
        },

        /**
         * determine if the called method is available
         *
         * @param {string} methodName
         *
         * @return {boolean}
         */
        '_isValidMethod': function (methodName) {
            var methodMap = this._getMethodMap();
            if (typeof(methodMap[methodName]) == 'undefined') {
                return false;
            }

            return true;
        },

        /**
         * returns error message
         *
         * @param {String} message
         *
         * @return {void}
         */
        '_returnErrorMessage': function (message) {
            this.res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            this.res.end('{"error":"' + message + '"}');
            return;
        },

        /**
         * calls system process jaws run and requrns output
         *
         * @return {void}
         */
        '_runApp': function () {
            var currentPath = this._getCurrentPath();
            var page = require(currentPath + "/handler.js");



            page.handler(this.event, this.context);
        },

        /**
         * returns current path in project
         *
         * @return {string}
         */
        '_getCurrentPath': function () {
            var method = this._getMethod();
            var methodMap = this._getMethodMap();
            return projectPath + '/aws_modules/' + this.moduleName + '/' + methodMap[method];
        }
    };

    eventConverter.init(req, res);
};

var server = https.createServer(serverOptions, handler).listen(8888);