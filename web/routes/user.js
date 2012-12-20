module.exports = function( app ) {
	var db = app.db
	  , type = app.schema.type
	  , message = app.schema.message
	  , md5 = require("express/node_modules/connect").utils.md5
	  , smarta = require("smarta");

	app.get(
		'/welcome'
	  , app.loginRequired
	  , app.when( function( req, res, next ) {
		  return db.users.nodes( req.currentUser )
		} )
			.local("nodes")
			.render("welcome")
	);

	app.get(
		'/login'
	  , app.when(null, [])
			.local("login", "errors")
			.render("login")
	);

	app.get(
		'/signup'
	  , app.retreatWhenLogin
	  , app.when({}, [])
			.local("user", "errors")
			.render("signup")
	);

	var reservedWords = ["register", "login", "signup", "logout", "admin", "help", "index", "new", "users", "user", "nodes", "node", "messages", "message", "statuses", "status", "notifications", "notification", "account", "inbox", "blog", "search", "about", "features", "contact", "support", "shops", "shop", "api", "welcome", "forum", "forums"];

	var userSchema = type.object( {
		login: type.string()
			.alias("用户名")
			.trim()
			.lowercase()
			.notEmpty()
			.cleanable()
			.validator( function checkReservedWord (val) {
				return reservedWords.indexOf( val ) == -1;
			}, "被系统保留，不能使用" )
			.validator( function checkUniqLogin (val, done) {
				db.users.findOne({login: val}, function(err, _user) {
					done( !err && !_user );
				});
			}, message("taken") )
		, email: type.string()
			.alias("邮箱")
			.trim()
			.notEmpty()
			.email()
		, name: type.string()
			.alias("名字")
			.trim()
			.notEmpty()
		, password: type.string()
			.alias("密码")
			.trim()
			.notEmpty()
			.len(6, 12)
		, password_confirmation: type.string()
			.alias("确认密码")
			.trim()
			.notEmpty()
			.validator(function(val) {
				return val == this.password;
			}, "两次密码不一样")
	} );

	var userSensor = new smarta.sensor("用户注册");

	app.post(
		'/signup'
	  , app.retreatWhenLogin
	  , function validateUser( req, res, next ) {
		  userSchema.val( req.body ).validate( function( err ) {
			  if( err ) {
				  res.render('signup', {
					  errors: err.messages()
					, user: req.body
				  });
			  } else {
				  next();
			  }
		  } );
		}
	  , app.when( function( req, res, next ) {
		  var body = req.body;
		  return db.users.insert( {
			  login: body.login
			, name: body.name
			, email: body.email
			, password: new Buffer(body.password, 'utf8').toString('base64')
			, cryptedPassword: md5( body.password )
			, createdAt: new Date()
		  } )
			  .next( function( docs ) {
				  var user = docs && docs[ 0 ];
				  return user ? user : new Error("System error when insert user");
			  } )
			  .done( function( user ) {
				  userSensor.info( user.login + " - " + user.name + " 注册了" );
			  } );
		} )
			.local("user")
	  , function( req, res, next ) {
		  var user = res.local("user");
		  req.login( user._id, function() {
			  res.redirect('/welcome');
		  } );
		}
	);

	app.post(
		'/login'
	  , function( req, res, next ) {
		  //authenticate
		  db.users.findOne( { login: req.body.login } )
			  .done( function( user ) {
				  if( user && md5( req.body.password ) == user.cryptedPassword ) {
					  req.login( user._id, function() {
						  res.redirect('home');
					  } );
				  } else {
					  res.render('login', {
						  errors: ["用户名或密码错误"]
						, login: req.body.login
					  });
				  }
			  } )
			  .fail( next );
		}
	);

	app.get(
		'/logout'
	  , function(req, res) {
		  req.logout( function() {
			  res.redirect('home');
		  } );
		}
	);

	//app.get(
	//	'/logout'
	//  , app.when ( function(req, res) {
	//	  	req.logout( this );
	//	} ).redirect( 'home' );
	//);
};
