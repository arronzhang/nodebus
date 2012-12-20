module.exports = function retreatWhenLogin (req, res, next) {
	req.currentUser ? res.redirect('home') : next();
}
