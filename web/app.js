
/** command line helper */

var optimist = require('optimist')
	.describe('m', 'For mobile')
	.describe('h', 'Server host').default('h', '0.0.0.0').alias('h', 'host')
	.describe('p', 'Server port').default('p', '3000').alias('p', 'port')
	.describe('help', 'Show help')
	.usage("Usage: -h [host] -p [port]");

var argv = optimist.argv;
if( argv.help ) {
	optimist.showHelp();
	process.exit(1);
}

/** deps */
var express = require("express")
  , fs = require("fs")
  , app = module.exports = express.createServer()
  , colors = require("colors")
  , smarta = require("smarta");

/** db */
var db  = app.db = require("./db.js");

/** config */
app.configure(function(){
	/**
	 * Get real ip from nginx proxy. 
	 */
	express.logger.token('real-ip', function(req, res) {
		return req.headers['x-real-ip'] || req.socket.remoteAddress;	
	});
	app.set('mobile', argv.m);
	app.set('views', __dirname + (argv.m ? '/mviews' : '/views'))
		.set('view engine', 'jade')
		.set('host', argv.h)
		.set('port', argv.p)
		.use(express.favicon())
		.use(express.static(__dirname + '/public'))
		.use(express.bodyParser())
		.use(express.methodOverride())
		.use(express.cookieParser())
		.use(function disguiseHeader(req, res, next){
			res.header("X-Powered-By", "PHP/5.2.5");
			next();
		})
		.use(express.session( {
			secret: "EQWER23fN23NIESWE",
			store: db.sessionStore,
			key: "_sid",
			cookie: { 
				path: '/',
				httpOnly: true,
				maxAge: 5*60*60*1000, //Session store 5hours
			}
		} ))
		.use(express.logger({ format: "Started " + ":method".underline + " " + ":url".green + " for :real-ip at :date Completed :status in " + ":response-time ms".yellow }));
	//http:\/\/senchalabs.github.com/connect/middleware-logger.html
	//	app.use(express.router);
});

//NODE_ENV=development
app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//NODE_ENV=production
app.configure('production', function(){
	//app.use(express.errorHandler());
	app.use(function(err, req, res, next){
		res.render('500.jade', {
			err: err
		});
	});
});

app.configure('test', function(){
	app.use(express.errorHandler());
});

var dir = __dirname + '/middleware'
  , reJS = /(\.js$)|(\.node$)/;
app.middleware = {};
fs.readdirSync( dir ).forEach(function( file ){
	if( reJS.test( file ) ) {
		var name = file.replace(reJS, "")
		app[ name ] = app.middleware[ name ] = require( dir + "/" + file );
	}
});

