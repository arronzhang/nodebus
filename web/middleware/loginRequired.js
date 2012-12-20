
module.exports = function loginRequired(req, res, next){
	if( !req.currentUser ) {
		req.flash("error", "该页需要登录才能访问!");
		res.redirect('home');
	} else {
		next();
	}
}
