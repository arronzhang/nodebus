
module.exports = function notFound(req, res, next) {
	// respond with html page
	if (req.accepts('html')) {
		res.status(404);
		res.render('404', { url: req.url });
		return;
	}

	// respond with json
	if (req.accepts('json')) {
		res.send({ error: 'Not found' });
		return;
	}

	// default to plain-text. send()
	res.contentType("text/plain");
	res.send('Not found');

};
