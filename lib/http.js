var qs = require('querystring');

exports.readFormBody = function(req, done) {
	var body = '';
	req.on('data', function(chunk) {
		body += chunk;
		if (body.length > 1024 * 1024) {
			req.destroy();
			done(new Error('request body too large'));
		}
	});
	req.on('error', done);
	req.on('end', function() {
		try {
			done(null, qs.parse(body));
		} catch (err) {
			done(err);
		}
	});
};

exports.sendJson = function(resp, statusCode, payload) {
	resp.writeHead(statusCode, { 'Content-Type': 'application/json' });
	resp.end(JSON.stringify(payload));
};

exports.requireFields = function(source, fields) {
	return fields.filter(function(field) {
		return source[field] == null || String(source[field]).trim() === '';
	});
};
