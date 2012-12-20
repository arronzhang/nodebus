/**
 * Bind promise object to view
 *
 * Examples:
 *
 * 		when(function( req, res, next ) {
 * 		     return db.user.findOne();
 * 		})
 * 		    .local("user")
 * 		    .render("login");
 * 		    
 * 		when({name: "Jack"})
 * 		    .local("user")
 * 		    .render("login");

 *
 *
 * @param {Function|...} callback 
 * @return {When}
 * @api public
 *
 */

var util = require("util")
  , slice = [].slice;

module.exports = function when( first ) {
	var attrs = null
	  , view = null
	  , args = slice.call(arguments, 0);

	when.local = function() {
		attrs = arguments;
		return when;
	};

	when.render = function( arg ) {
		view = arg;
		return when;
	};

	return when;
	//TODO: when(promsie, promise...)
	function when ( req, res, next ) {
		var promise = typeof first == "function" ? first( req, res, next ) : args;
		if( promise && typeof promise.promise == "function" ) {
			promise.then( function() {
				done( req, res, next, arguments );

			}, function( err ) {
				done( req, res, next, null, err );
			} );
		} else {
			( promise instanceof Error ) ? done( req, res, next, null, promise ) : done( req, res, next, util.isArray( promise ) ? promise : [ promise ] );
		}
	}

	function done ( req, res, next, ob, err ) {
		if( arguments.length > 4 ) {
			next ( err );
		} else {
			var len;
			if( attrs && ( len = attrs.length ) ) {
				for( var i = 0; i < len; i++ ) {
					res.local(attrs[i], ob[i]);
				}
			}
			view ? res.render( view ) : next();
		}
	}
}

