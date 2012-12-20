/** deps */
var express = require("express")
  , app = require("./app.js")
  , eve = app.schema = require("EVE")
  , async = require("async")
  , smarta = require("smarta");

/** db */
var db = app.db
  , users = db.users
  , nodes = db.nodes
  , roster = db.roster
  , messages = db.messages;

/** schema */
var message = eve.message;
message.locale("zh-CN");
var type = eve.type;

type.extend("string", {
	cleanable: function() {
		return this.match( /^[a-zA-Z]+[a-zA-Z0-9]{2,11}$/, "只能由3-12位的字母和数字组成(第一个必须字母)" );
	}
} );

/** configure middleware */

app.use(app.currentUser(function findUser(id, callback){ //user
	db.users.findOne({
		_id: typeof id === "string" ? db.ObjectID(id) : id
	}, callback);
}))
	.use(app.htmlHead("NodeBus", "", ["nodebus", "notification"], "")); // html head

//NODE_ENV=production
app.configure('production', function(){
	/** monit */
   if ( !app.set('mobile') ) {
	   var monit = require("./lib/monit.js")
		 , cron = require("cron")
		 , sensor = new smarta.sensor("数据统计");

	   cron.CronJob("00 00 10 * * *", function() {
		   monit.count(db, function(msg) {
			   //log sensor
			   console.log( msg );
			   sensor.info( msg );
		   });
	   });
   }
});

app.configure('test', function(){
	/** monit */
   if ( !app.set('mobile') ) {
	   var monit = require("./lib/monit.js")
		 , cron = require("cron")
		 , sensor = new smarta.sensor("数据统计");

	   monit.count(db, function(msg) {
		   console.log( msg );
		   sensor.info( msg );
	   });
   }
});

function nodePath (name, path) {
	name = typeof name === "string" ? name : name.name;
	return "/" + name.replace(".", "/") + (path ? ("/" + path) : "");
}

function nodeStatusClass ( node ) {
	return node && node.presence && node.presence.toLowerCase() == "available" 
		? ( node.show == "xa" ? "icon-mini-critical" : "icon-mini-available" ) : "icon-mini-unavailable";
}

function nodeStatusTitle ( node ) {
	return node && node.presence && node.presence.toLowerCase() == "available" 
		? ( node.show == "xa" ? "故障" : "在线" ) : "离线";
}

/** helpers */

function escape(html){
	return String(html || "")
		.replace(/&(?!\w+;)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

app.helpers({
	nodePath: nodePath
  , nodeStatusClass: nodeStatusClass
  , nodeStatusTitle: nodeStatusTitle
  , formatDate: function(time) {
	  if( time ) {
		  var m = time.getMonth()
			, d = time.getDate()
			, h = time.getHours()
			, min = time.getMinutes();
		  return m + 1 + "-" + (d < 10 ? ("0" + d) : d) + " " + (h < 10 ? ("0" + h) : h) + ":" + (min < 10 ? ("0" + min) : min);
	  }
	  return null;
	}
  , escapeMsg: function(str) {
	  return escape(str).replace(/\r?\n/g, "<br />");
	}
});

app.dynamicHelpers({
	error: function(req, res){
		return req.flash("error");
	},
	info: function(req, res){
		return req.flash("info");
	}
});

/* router */

require('./routes.js')( app );

/**
 * Expose middleware
 *
 * 	auto("index.jade") //=> res.render("index.jade");
 * 	auto({name: "hidden"}) //=> req.name = "hidden";
 * 	auto({name: "hidden"}, "index.jade") //=> res.locals.name = "hidden";
 * 	auto(function(){return promise}, "user") //=> req.user = doc;
 *
 */

function auto( promise, names, view ) {
	var isAr = Array.isArray( names );
	names = isAr ? names : [names];
	var fn = function ( req, res, next ) {
		if( typeof promise == "function" ) {
			promise = promise(req, res);
		}
		if( promise && typeof promise.promise == "function" ) {
			promise.done( ok ).fail( next );
		} else if( isAr ) {
			ok.apply( null, !isAr || ( isAr && !Array.isArray( promise) ) ? [ promise ] : promise );
		}
		function ok() {
			if( view ) {
				for (var i = names.length - 1; i >= 0; i--) {
					res.local( names[i], arguments[i] );
				};
				res.render( view );
			} else {
				for (var i = names.length - 1; i >= 0; i--) {
					req[ names[i] ] = arguments[i];
				};
			}		
		};
	}
	fn.name = names.join(",");
	return fn;
};

app.get('/api', function(req, res) {
	res.render("api");
});


//https://chart.googleapis.com/chart?&cht=ls&chd=t:0,30,60,70,90,95,100|20,30,40,50,60,70,80|10,30,40,45,52&chco=ff0000,00ff00,0000ff&chs=250x150&chdl=NASDAQ|FTSE100|DOW
var  chartUrl = "https://chart.googleapis.com/chart?&cht=ls&chs=450x80&chco=a4a5fa,d6f3aa,da36c5&";
function chart ( metrics ) {
	if( metrics.length < 2 ) {
		return null;
	}
	//Filter key
	var metric = metrics[metrics.length - 1]
	  , labels = metric.graph
	  , data = {}
	  , key;

	//for (key in metric) {
	//	if( key.indexOf("%") != -1 ) {
	//		labels.push( key );
	//		data[key] = [];
	//	}
	//};
	if( !labels || !labels.length )
		return null;

	metrics.forEach(function(d) {
		labels.forEach(function(l) {
			data[l] = data[l] || [];
			data[l].push( d[l] || 0 );
		});
	});

	var d  = labels.map(function(l) {
		return data[l].join(",");
	}).join("|");
	return chartUrl + "chd=t:" + d + "&chdl=" + labels.join("|");
}

function fillChart() {
	var messages = arguments[arguments.length - 1];
	messages = messages.filter(function(m) {
		if( m.createdAt && m.severity > 1 ){
			var ts = m.createdAt.getTime()/1000;
			m.ts = {$gt: ts - 60*60*3, $lte: ts};
			return true;
		};
		return false;
	});
	var cached = {};
	var query = messages.map(function(m) {
		cached[m.node + m.thread + m.ts.$lte] = m;
		return {n: m.node, s: m.thread, ts: m.ts};
	});
	return query.length ? db.metrics.find({$or: query}).toArray().done(function(metrics) {
		var data = {}
		  , key;
		metrics.forEach(function(metric) {
			var key;
			for( key in cached ){
				var m = cached[ key ];
				if( m.node == metric.n && m.thread == metric.s && metric.ts > m.ts.$gt &&  metric.ts <= m.ts.$lte){
					data[key] = data[key] || [];
					data[key].push( metric );
				}
			}
		});
		for( key in data ){
			cached[key]["chart"] = chart( data[key] );
		}
	}) : [];
}

app.get(
	'/:user?/:node?'
  , function index( req, res, next ) {
	  if( req.params.user && !req.params.node ) {
		  return app.notFound( req, res, next );
	  }
	  if( !req.currentUser ) {
		  res.render('login', {
			  errors: []
			, login: null
		  });
	  } else {
		  next();
	  }
	}
  , function home( req, res, next ) {
	  var body = req.query
		, node = req.node
		, defaultCount = 20
		, count = parseInt(body.count) || defaultCount
		, page = parseInt(body.page) || 1
		, skip
		, query = node ? { node: node.name } : {}
		, options = {};
	  if( count > 50 || count < 1 ) {
		  count = defaultCount;
	  }
	  page = page < 1 ? 1 : page;
	  skip = (page - 1) * count;

	  db.users.nodes(req.currentUser)
		  .and(function( nodes ) {
			  if ( !query.node ) {
				  query.node = nodes.length ? {"$in": nodes.map(function(n){return n.name}) } : null;
			  }
			  return messages.find(query).skip(skip).limit(count).sort({_id: -1}).toArray();
		  })
		  .and( fillChart )
		  .done( function( nodes, messages ) {
			  res.render('home', {
				  count: count
				, page: page
				, messages: messages
				, nodes: nodes
				, node: node
				, showDesc: node && body["desc"] != undefined
				, showInstall: node && body["new"] != undefined
			  });
		  }).fail( next );
	}
);


app.use( app.notFound );

module.exports = app;

if( !module.parent ) {
	app.listen( Number( app.set("port") ), app.set("host") );
	console.log( "Express %s application starting in %s on %s:%d at %s", express.version, app.settings.env, app.set("host"), app.set("port"), new Date().toLocaleString() );
}
