/**
 * app.use( require("./currentUser")(function findUser(id, callback) {
 *	
 * }) );
 *
 * req.currentUser
 * req.login(id, callback)
 * req.logout()
 *
 * views:
 * 	req.locals.currentUser
 *
 */

module.exports = function( userFind ) {
	return function currentUser(req, res, next){
		setUser( null );
		req.login = login;
		req.logout = logout;
		var t;
		if ( t = req.session && req.session.uid ) { //from session
			userFind(t, function( err, user ) {
				if( err ) {
					next( err );
				} else {
					setUser( user );
					next();
				}
			});
		} else {
			next();
		}

		function setUser( user ) {
			req.currentUser = user || null;
			res.local && res.local( "currentUser", req.currentUser );
		}

		function login( id, callback ) {
			// Regenerate session when signing in
			// to prevent fixation 
			req.session.regenerate( function(){
				// Store the user's primary key
				// in the session store to be retrieved,
				// or in this case the entire user object
				req.session.uid = id;
				callback && callback();
			} );
		}

		function logout( callback ) {
			req.session.destroy(function(){
				callback && callback();
			});
		}
	}
}

