module.exports = function( app ) {
	var db = app.db
	  , type = app.schema.type
	  , message = app.schema.message
	  , async = require("async")
	  , smarta = require("smarta")
	  , nodes = db.nodes
	  , uid = require("express/node_modules/connect").utils.uid
	  , nodePath = app._locals.nodePath;

	app.get( 
		'/nodes'
	  , app.loginRequired
	  , function(req, res, next){
		  db.users.nodes( req.currentUser )
			  .done(function( nodes ) {
				  res.render('nodes', {
					  nodes: nodes
				  });
			  }).fail( next );
		}
	);

	app.param( 
		"node"
	  , app.loginRequired
	  , function nodeData(req, res, next, id) {
		  db.users.node(req.currentUser, {
			  user: req.params.user
			, name: req.params.user + "." + req.params.node
		  })
			  .and( function(node) {
				  return node && nodes.users(node);
			  } )
			  .done( function(node, users) {
				  if( !node ){
					  req.flash("info", "该节点不存在");
					  return res.redirect("home");
				  }
				  node.users = users;
				  req.node = node;
				  next();
			  } )
			  .fail( next );
		} 
	);

	app.get(
		'/:user/:node/admin'
	  , function(req, res, next){
		  res.render("nodes/admin", {
			  node: req.node
			, errors: []
		  });
		}
	);

	app.post(
		'/:user/:node/admin/rename'
	  , function(req, res, next) {
		  if( req.body.label ) {
			  next();
		  } else {
			  res.render('nodes/admin', {
				  errors: ["名称不能为空"]
				, node: req.node
			  });
		  }
		}
	  , function( req, res, next ) {
		  var errors = []
			, node = req.node;
		  node.label = req.body.label;
		  nodes.rename(node)
			  .done( function() {
				  req.flash("info", "改名成功");
				  res.redirect( nodePath( node ) );
			  } )
			  .fail( next );
		}
	);

	app.del(
		'/:user/:node'
	  , function(req, res, next) {
		  nodes.destory( req.node )
			  .done( function() {
				  req.flash("info", "成功删除节点：" + req.node.label);
				  res.redirect( "home" );
			  } )
			  .fail( next );
		}
	);

	var validatefUser = function(req, res, next) {
		var login = req.param("login");
		if( login ) {
			db.users.findOne( { login: login } )
				.done(function(user) {
					if( user ) {
						req.user = user;
						next();
					} else {
						res.render('nodes/admin', {
							errors: ["该用户不存在"]
						  , node: req.node
						});
					}
				})
				.fail( next );
		} else {
			res.render('nodes/admin', {
				errors: ["用户名不能为空"]
			  , node: req.node
			});
		}
	};

	app.post(
		'/:user/:node/admin/share'
	  , validatefUser
	  , function(req , res, next ) {
		  db.users.follow(req.user, req.node)
			  .done(function() {
				  req.flash("info", "添加成功");
				  res.redirect( nodePath( req.node ) );
			  })
			  .fail( next );
		}
	);

	app.get(
		'/:user/:node/admin/unfollow'
	  , validatefUser
	  , function(req, res, next){
		  var login = req.query.login
			, node = req.node
			, users = node.users;
		  users = users && users.filter(function(u) {
			  return u.login == login;
		  });
		  var user = users && users[0];
		  if( !user ){
			  req.flash("error", "该用户未关注此节点");
			  return res.redirect(nodePath(node, "admin"));
		  }
		  if( req.currentUser.login == node.user && node.user == login ) {
			  req.flash("error", "暂不支持取消关注自己的节点");
			  return res.redirect(nodePath(node, "admin"));
		  } else if(req.currentUser.login != node.user && req.currentUser.login != login){
			  req.flash("error", "无权限");
			  return res.redirect(nodePath(node, "admin"));
		  }
		  db.users.unfollow( user, node )
			  .done( function() {
				  req.flash("info", "取消关注成功");
				  if( req.currentUser.login == node.user ) {
					  res.redirect( nodePath(node) );
				  } else {
					  res.redirect("home");
				  }
			  } )
			  .fail( next );
		}
	);

	app.get(
		'/nodes/new'
	  , app.loginRequired
	  , function(req, res, next){
		  res.render("nodes/new", {node: {}, errors: {}});
		}
	);

	var nodeSchema = type.object( {
		name: type.string()
			.alias("节点账号")
			.trim()
			.lowercase()
			.notEmpty()
			.cleanable()
			.validator( function(val, done) {
				nodes.findOne({login: this.user + "." + val}, function(err, doc) {
					done( !err && !doc );
				});
			}, message("taken") )
		, label: type.string()
			.alias("节点名称")
			.trim()
			.notEmpty()
	} );

	function validateSchema( schema ) {
		return function validation (req, res, next) {
			schema.val( req.body )
				.validate( function( err ) {
					req.errors = err || null;
					next();
				} );
		}
	}

	var nodeSensor = new smarta.sensor( "添加节点" );

	function createNode (node, user) {
		node.apikey =  uid(8).toLowerCase();
		node.createdAt = new Date();
		return nodes.insert( node )
			.next(function(docs) {
				var node = docs && docs[ 0 ];
				return node || new Error("System error when insert node");
			})
			.and(function(node) {
				return db.nodes.initRoster(node, user);
			});
	}


	app.post(
		'/nodes/create'
	  , app.loginRequired
	  , function(req, res, next) {
		  req.body.user = req.currentUser.login;
		  next();
		}
	  , function validateNode( req, res, next ) {
		  nodeSchema.val( req.body ).validate( function( err ) {
			  if( err ) {
				  res.render('nodes/new', {
					  errors: err.messages()
					, node: req.body
				  });
			  } else {
				  next();
			  }
		  } );
		}
	  , function( req, res, next ) {
		  var body = req.body
			, node = {
				name: body.user + "." + body.name
			  , label: body.label
			  , user: body.user
			  };
		  createNode(node, req.currentUser)
			  .fail( next )
			  .done( function() {
				  req.flash("info", "创建节点成功");
				  res.redirect(nodePath(node, "?new&desc"));
				  nodeSensor.info( req.currentUser.name + " 添加了节点 " + node.name );
			  } );
		}
	);

	app.get( 
		'/smartax.conf'
	  , app.loginRequired
	  , function(req, res, next){
		  //db.nodes.find({user: req.currentUser.login}).toArray()
		  db.users.nodes(req.currentUser)
			  .done(function(nodes) {
				  var text = req.param("text") || ""
					, markup = [];
				  nodes.forEach(function(node) {
					  markup.push( 
						  text.replace(/\$name/ig, node.name)
							  .replace(/\$label/ig, node.label)
							  .replace(/\$apikey/ig, node.apikey)
							  .replace(/\$host/ig, node.host)
					  );
				  });
				  res.send(markup.join("\n"), { 'Content-Type': 'text/plain' });
			  })
			  .fail(next);
		}
	);

	app.get(
		'/nodes/tool'
	  , app.loginRequired
	  , function(req, res) {
		  res.render("nodes/tool", { nodes: null });
		}
	);

	function createOrUpdateNode ( node, user ) {
		var query = {name: node.name};
		return db.nodes.findOne(query)
			.next(function(doc) {
				return doc ? db.nodes.update(query, {$set: node}, {safe: true})
					.next(function() {
						node.isUpdate = true;
						return db.nodes.initRoster(node, user);
					})	: createNode(node, user);
			});
	}

	var parseNodes = require("../lib/parseNodes");
	app.post(
		'/nodes/tool'
	  , app.loginRequired
	  , function(req, res, next) {
		  var file = req.files.file
			, currentUser = req.currentUser
			, login = currentUser.login;
		  if( file && file.length ) {
			  parseNodes( file.path, function(err, nodes) {
				  if( !nodes.length ) {
					  req.flash("error", "没有节点");
					  res.redirect( "/nodes/tool" );
				  } else {
					  var i = 2
						, ok = []
						, fail = [];
					  async.forEachSeries(nodes, function(node, cb) {
						  if( !node.name || !node.label ) {
							  node.error = new Error("缺少name或label");
							  return cb();
						  }
						  node.user = login;
						  node.name = login + "." + node.name;
						  createOrUpdateNode( node, currentUser )
							  .done(function(c) {
								  node.success = node.isUpdate ? "更新成功" : "添加成功";
								  ok.push( node );
							  })
							  .fail(function(e) {
								  node.error = e;
								  fail.push( node );
							  })
							  .always(function() {
								  node.id = i++;
								  cb();
							  });
					  }, function() {
						  nodes.ok = ok;
						  nodes.fail = fail;
						  res.render( 'nodes/tool', {
							  nodes: nodes
						  } );
					  } );
				  }
			  } );
		  } else {
			  req.flash("error", "请选择一个文件");
			  res.redirect( "/nodes/tool" );
		  }
		}
	);
}
